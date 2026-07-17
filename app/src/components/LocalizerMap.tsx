import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { latLngBounds, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HomeRef, Segment } from '../lib/csv';
import { metersOffset, projectToLatLon } from '../lib/geo';
import { C } from '../lib/canvas';

interface LocalizerMapProps {
  segment: Segment;
  home: HomeRef | null;
}

const MIN_RADIUS_M = 50;

/** Re-fits the view to the given points, keeping `home` exactly centered,
 * whenever the segment or home changes (react-leaflet only honors
 * MapContainer's center/zoom on first mount). */
function FitToHome({
  homeLat,
  homeLon,
  points,
}: {
  homeLat: number;
  homeLon: number;
  points: LatLngTuple[];
}) {
  const map = useMap();

  useEffect(() => {
    let radius = MIN_RADIUS_M;
    for (const [lat, lon] of points) {
      const { north, east } = metersOffset(homeLat, homeLon, lat, lon);
      radius = Math.max(radius, Math.abs(north), Math.abs(east));
    }
    radius *= 1.15;
    const dLat = radius / 111320;
    const dLon = radius / (111320 * Math.cos((homeLat * Math.PI) / 180));
    const bounds: LatLngBoundsExpression = latLngBounds(
      [homeLat - dLat, homeLon - dLon],
      [homeLat + dLat, homeLon + dLon]
    );
    map.fitBounds(bounds, { animate: false });
  }, [map, homeLat, homeLon, points]);

  return null;
}

export function LocalizerMap({ segment, home }: LocalizerMapProps) {
  const trackSegments = useMemo(() => {
    const rows = segment.rows.filter((r) => r.lat !== null && r.lon !== null);
    const groups: { positions: LatLngTuple[]; color: string }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1];
      const b = rows[i];
      const color = Math.abs(b.cross!) > 8 ? C.high : C.track;
      const last = groups[groups.length - 1];
      if (last && last.color === color) {
        last.positions.push([b.lat!, b.lon!]);
      } else {
        groups.push({
          positions: [
            [a.lat!, a.lon!],
            [b.lat!, b.lon!],
          ],
          color,
        });
      }
    }
    return groups;
  }, [segment]);

  const farPoint = useMemo((): LatLngTuple | null => {
    if (!home || home.headingRad === null) return null;
    const maxD = Math.max(...segment.rows.map((r) => r.dist!), 10);
    return projectToLatLon(home.lat, home.lon, home.headingRad, maxD, 0);
  }, [segment, home]);

  const fitPoints: LatLngTuple[] = useMemo(
    () => [...(farPoint ? [farPoint] : []), ...trackSegments.flatMap((g) => g.positions)],
    [farPoint, trackSegments]
  );

  if (!home) {
    return (
      <div className="fl-empty">
        This log doesn't include GPS/home data — reflash glideslope.lua and re-log to get the
        map view.
      </div>
    );
  }

  return (
    <MapContainer
      center={[home.lat, home.lon]}
      zoom={17}
      scrollWheelZoom
      className="localizer-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {farPoint && (
        <Polyline
          positions={[[home.lat, home.lon], farPoint]}
          pathOptions={{ color: C.course, weight: 1.5, dashArray: '5,5' }}
        />
      )}
      {trackSegments.map((g, i) => (
        <Polyline key={i} positions={g.positions} pathOptions={{ color: g.color, weight: 2.4 }} />
      ))}
      <CircleMarker
        center={[home.lat, home.lon]}
        radius={5}
        pathOptions={{ color: C.course, fillColor: C.course, fillOpacity: 1 }}
      />
      <FitToHome homeLat={home.lat} homeLon={home.lon} points={fitPoints} />
    </MapContainer>
  );
}
