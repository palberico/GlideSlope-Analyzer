import { useEffect, useRef } from 'react';
import type { Segment } from '../lib/csv';
import { C, fit, label } from '../lib/canvas';

interface PlanChartProps {
  segment: Segment;
}

const HEIGHT = 300;

function drawPlan(cv: HTMLCanvasElement, seg: Segment) {
  const { g, w, h } = fit(cv, HEIGHT);
  if (!w) return;
  g.clearRect(0, 0, w, h);
  const rows = seg.rows;
  const L = 20,
    R = 20,
    T = 16,
    B = 26,
    x0 = L,
    x1 = w - R,
    y0 = h - B,
    y1 = T;
  const maxD = Math.max(...rows.map((r) => r.dist!), 10);
  const maxC = Math.max(10, ...rows.map((r) => Math.abs(r.cross!))) * 1.15;
  const cx = (x0 + x1) / 2;
  const X = (c: number) => cx + (c / maxC) * ((x1 - x0) / 2); // cross +right
  const Yd = (d: number) => y0 - (d / maxD) * (y0 - y1);

  // centerline
  g.strokeStyle = C.course;
  g.globalAlpha = 0.8;
  g.setLineDash([5, 5]);
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(cx, y1);
  g.lineTo(cx, y0);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
  // side scale
  g.strokeStyle = C.hair;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y0);
  g.stroke();
  label(g, 'L', x0 + 2, y0 + 16, C.faint, 'left');
  label(g, 'R', x1 - 2, y0 + 16, C.faint, 'right');
  label(g, 'CENTERLINE', cx, y0 + 16, C.muted, 'center');
  label(g, 'target', cx + 7, Yd(0) - 2, C.faint, 'left');

  // track coloured by lateral dev
  g.lineWidth = 2.4;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1],
      b = rows[i];
    g.strokeStyle = Math.abs(b.cross!) > 8 ? C.high : C.track;
    g.beginPath();
    g.moveTo(X(a.cross!), Yd(a.dist!));
    g.lineTo(X(b.cross!), Yd(b.dist!));
    g.stroke();
  }
  g.fillStyle = C.course;
  g.beginPath();
  g.arc(cx, Yd(0), 3.5, 0, 7);
  g.fill();
}

export function PlanChart({ segment }: PlanChartProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function draw() {
      if (ref.current) drawPlan(ref.current, segment);
    }
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [segment]);

  return <canvas ref={ref} height={HEIGHT} />;
}
