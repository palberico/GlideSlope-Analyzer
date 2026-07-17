import { useEffect, useRef } from 'react';
import type { Row, Segment } from '../lib/csv';
import { C, axes, fit, label } from '../lib/canvas';

interface DevChartProps {
  segment: Segment;
}

const HEIGHT = 300;

function drawDev(cv: HTMLCanvasElement, seg: Segment) {
  const { g, w, h } = fit(cv, HEIGHT);
  if (!w) return;
  g.clearRect(0, 0, w, h);
  const rows = seg.rows;
  const L = 40,
    R = 16,
    T = 14,
    B = 28,
    x0 = L,
    x1 = w - R,
    y0 = h - B,
    y1 = T;
  const maxD = Math.max(...rows.map((r) => r.dist!), 10);
  const m = Math.max(5, ...rows.map((r) => Math.max(Math.abs(r.vdev!), Math.abs(r.cross!)))) * 1.1;
  const X = (d: number) => x1 - (d / maxD) * (x1 - x0);
  const Y = (v: number) => (y0 + y1) / 2 - (v / m) * ((y0 - y1) / 2);

  // zero line + grid
  g.strokeStyle = C.hair;
  g.beginPath();
  g.moveTo(x0, Y(0));
  g.lineTo(x1, Y(0));
  g.stroke();
  label(g, '0', x0 - 6, Y(0) + 3, C.faint, 'right');
  label(g, '+' + m.toFixed(0), x0 - 6, Y(m) + 3, C.faint, 'right');
  label(g, '-' + m.toFixed(0), x0 - 6, Y(-m) + 3, C.faint, 'right');
  axes(g, x0, y1, x1, y0);
  label(g, 'DIST TO GO (m)', (x0 + x1) / 2, h - 4, C.muted, 'center');

  const line = (key: keyof Row, col: string) => {
    g.strokeStyle = col;
    g.lineWidth = 2;
    g.beginPath();
    rows.forEach((r, i) => {
      const px = X(r.dist!),
        py = Y(r[key] as number);
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    });
    g.stroke();
  };
  line('vdev', C.course);
  line('cross', C.track);
}

export function DevChart({ segment }: DevChartProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function draw() {
      if (ref.current) drawDev(ref.current, segment);
    }
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [segment]);

  return <canvas ref={ref} height={HEIGHT} />;
}
