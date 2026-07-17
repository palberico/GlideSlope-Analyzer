/** Meters per degree of latitude (and of longitude at the equator) — matches
 * the flat-earth approximation glideslope.lua itself uses for a single
 * short-range approach, so derived points line up with the logged dist/cross. */
export const DEG2M = 111320;

/**
 * Inverse of glideslope.lua's solve() projection: given the home position and
 * locked centerline heading, returns the lat/lon that is `dist` meters along
 * the extended centerline (toward the approach) and `cross` meters right (+)
 * of it.
 */
export function projectToLatLon(
  homeLat: number,
  homeLon: number,
  headingRad: number,
  dist: number,
  cross: number
): [number, number] {
  const hx = Math.sin(headingRad);
  const hy = Math.cos(headingRad);
  const east = -hx * dist + hy * cross;
  const north = -hy * dist - hx * cross;
  const lat = homeLat + north / DEG2M;
  const lon = homeLon + east / (DEG2M * Math.cos((homeLat * Math.PI) / 180));
  return [lat, lon];
}

/** Local east/north offset of (lat, lon) from a reference point, in meters. */
export function metersOffset(
  refLat: number,
  refLon: number,
  lat: number,
  lon: number
): { north: number; east: number } {
  const north = (lat - refLat) * DEG2M;
  const east = (lon - refLon) * DEG2M * Math.cos((refLat * Math.PI) / 180);
  return { north, east };
}
