export interface Row {
  ms: number | null;
  dist: number | null;
  cross: number | null;
  vdev: number | null;
  h: number | null;
  tgt: number | null;
  hdgset: number;
  gspd: number | null;
  lat: number | null;
  lon: number | null;
  hdg: number | null;
  home: number;
}

export interface Segment {
  rows: Row[];
}

const REQUIRED_COLUMNS = ['ms', 'dist', 'cross', 'vdev', 'h', 'tgt'];

export function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) throw new Error('The file is empty.');
  const head = lines[0].split(',').map((s) => s.trim());
  const idx: Record<string, number> = {};
  head.forEach((h, i) => (idx[h] = i));
  for (const n of REQUIRED_COLUMNS) {
    if (!(n in idx)) {
      throw new Error(
        "This isn't a glideslope log — missing the '" +
          n +
          "' column. Use a glideslope_*.csv, not the raw telemetry logger file."
      );
    }
  }
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    const num = (k: string): number | null => {
      const v = parseFloat(c[idx[k]]);
      return isNaN(v) ? null : v;
    };
    rows.push({
      ms: num('ms'),
      dist: num('dist'),
      cross: num('cross'),
      vdev: num('vdev'),
      h: num('h'),
      tgt: num('tgt'),
      hdgset: 'hdgset' in idx ? parseInt(c[idx.hdgset] || '0', 10) : 1,
      gspd: 'gspd' in idx ? num('gspd') : null,
      lat: 'lat' in idx ? num('lat') : null,
      lon: 'lon' in idx ? num('lon') : null,
      hdg: 'hdg' in idx ? num('hdg') : null,
      home: 'home' in idx ? parseInt(c[idx.home] || '0', 10) : 0,
    });
  }
  return rows;
}

/** keep rows where the tool had a live solution */
export function validRows(rows: Row[]): Row[] {
  return rows.filter((r) => r.hdgset === 1 && r.dist !== null && r.h !== null && r.tgt !== null);
}

/** median glideslope angle actually used, from tgt=dist*tan(slope) */
export function deriveSlope(rows: Row[]): number {
  const a: number[] = [];
  for (const r of rows) {
    if (r.dist! > 8) a.push((Math.atan2(r.tgt!, r.dist!) * 180) / Math.PI);
  }
  if (!a.length) return 3;
  a.sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
}

export interface HomeRef {
  lat: number;
  lon: number;
  /** Locked centerline heading, in radians. Null if the log never locked a heading. */
  headingRad: number | null;
}

/**
 * Recovers the home position and locked centerline heading straight from the raw
 * log, using the same instants glideslope.lua itself captured them: home is the
 * GPS fix on the first row with `home===1` (the row logged right after the script
 * grabbed that reading as its origin), and the heading is the `hdg` sensor reading
 * on the first row with `hdgset===1` (logged right after lockHeading() ran). This
 * mirrors the script's own thLat/thLon/thHdgRad exactly rather than re-deriving
 * them by fitting the dist/cross columns, which the log never stores directly.
 */
export function deriveHome(rows: Row[]): HomeRef | null {
  const homeRow = rows.find((r) => r.home === 1 && r.lat !== null && r.lon !== null);
  if (!homeRow) return null;
  const hdgRow = rows.find((r) => r.hdgset === 1 && r.hdg !== null);
  return {
    lat: homeRow.lat!,
    lon: homeRow.lon!,
    headingRad: hdgRow ? (hdgRow.hdg! * Math.PI) / 180 : null,
  };
}

/** split a flight into approaches: segments that descend toward a dist minimum */
export function detectApproaches(rows: Row[]): Segment[] {
  const v = validRows(rows);
  if (!v.length) return [];
  const NEAR = 40,
    FAR = 120; // metres
  const out: { s: number; e: number; min: number; minI: number }[] = [];
  let seg: { s: number; e: number; min: number; minI: number } | null = null;
  for (let i = 0; i < v.length; i++) {
    const d = v[i].dist!;
    if (d < FAR) {
      if (!seg) seg = { s: i, e: i, min: d, minI: i };
      seg.e = i;
      if (d < seg.min) {
        seg.min = d;
        seg.minI = i;
      }
    } else {
      if (seg && seg.min < NEAR) out.push(seg);
      seg = null;
    }
  }
  if (seg && seg.min < NEAR) out.push(seg);
  // map to row spans, expand start back to where the segment was farthest
  return out
    .map((s) => {
      let startI = s.s;
      for (let i = s.minI; i >= 0; i--) {
        if (v[i].dist! >= FAR) {
          startI = i + 1;
          break;
        }
        startI = i;
      }
      return { rows: v.slice(startI, s.e + 1) };
    })
    .filter((a) => a.rows.length > 4);
}
