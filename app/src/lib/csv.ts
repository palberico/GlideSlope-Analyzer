export interface Row {
  ms: number | null;
  dist: number | null;
  cross: number | null;
  vdev: number | null;
  h: number | null;
  tgt: number | null;
  hdgset: number;
  gspd: number | null;
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
