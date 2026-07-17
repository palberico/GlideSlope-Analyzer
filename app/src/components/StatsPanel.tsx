import type { Segment } from '../lib/csv';

interface StatsPanelProps {
  segment: Segment;
  slope: number;
}

function rms(a: number[]): number {
  return Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
}

export function StatsPanel({ segment, slope }: StatsPanelProps) {
  const r = segment.rows;
  const vdev = r.map((x) => x.vdev!);
  const cross = r.map((x) => x.cross!);
  const finalRows = r.filter((x) => x.dist! <= 30);
  const touch = r.reduce((m, x) => (x.dist! < m.dist! ? x : m), r[0]);

  const cells: [string, string][] = [
    ['Slope flown', slope.toFixed(1) + '°'],
    ['Approach length', Math.max(...r.map((x) => x.dist!)).toFixed(0) + ' m'],
    ['Vert RMS', rms(vdev).toFixed(1) + ' m'],
    ['Peak high', Math.max(0, ...vdev).toFixed(1) + ' m'],
    ['Peak low', Math.min(0, ...vdev).toFixed(1) + ' m'],
    ['Lateral RMS', rms(cross).toFixed(1) + ' m'],
    ['Max off-center', Math.max(...cross.map(Math.abs)).toFixed(1) + ' m'],
    ['At target — height', touch.h!.toFixed(1) + ' m'],
  ];

  let verdict: string;
  if (finalRows.length) {
    const fv = rms(finalRows.map((x) => x.vdev!));
    const fc = rms(finalRows.map((x) => x.cross!));
    const vt = fv < 2 ? 'on slope' : fv < 5 ? 'slightly off slope' : 'well off slope';
    const ct = fc < 3 ? 'on centerline' : fc < 8 ? 'drifting' : 'well off line';
    verdict = `Last 30 m: ${vt} (±${fv.toFixed(1)} m vertical), ${ct} (±${fc.toFixed(1)} m lateral).`;
  } else {
    verdict = "Approach didn't reach the last 30 m in this segment.";
  }

  return (
    <div className="card">
      <h3>Approach numbers</h3>
      <div className="stats">
        {cells.map(([k, v]) => (
          <div className="stat" key={k}>
            <div className="k">{k}</div>
            <div className="v mono">{v}</div>
          </div>
        ))}
      </div>
      <div className="verdict mono" style={{ color: 'var(--muted)' }}>
        {verdict}
      </div>
    </div>
  );
}
