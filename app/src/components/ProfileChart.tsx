import { useEffect, useRef } from 'react';
import type { Segment } from '../lib/csv';
import { C, axes, fit, label, niceStep } from '../lib/canvas';

interface ProfileChartProps {
  segment: Segment;
  slope: number;
}

const HEIGHT = 320;

function drawProfile(cv: HTMLCanvasElement, seg: Segment, SLOPE: number) {
  const { g, w, h } = fit(cv, HEIGHT);
  if (!w) return;
  g.clearRect(0, 0, w, h);
  const rows = seg.rows;
  const L = 54,
    R = 18,
    T = 16,
    B = 30,
    x0 = L,
    x1 = w - R,
    y0 = h - B,
    y1 = T;
  const maxD = Math.max(...rows.map((r) => r.dist!), 10);
  const maxH =
    Math.max(...rows.map((r) => Math.max(r.h!, r.tgt!)), maxD * Math.tan((SLOPE * Math.PI) / 180)) *
      1.12 +
    1;
  const minH = Math.min(0, ...rows.map((r) => r.h!));
  const X = (d: number) => x1 - (d / maxD) * (x1 - x0); // target (d=0) at RIGHT
  const Y = (v: number) => y0 - ((v - minH) / (maxH - minH)) * (y0 - y1);

  // gridlines (distance)
  const step = niceStep(maxD, 5);
  g.textAlign = 'center';
  for (let d = 0; d <= maxD + 1; d += step) {
    const px = X(d);
    g.strokeStyle = C.hair;
    g.globalAlpha = 0.5;
    g.beginPath();
    g.moveTo(px, y1);
    g.lineTo(px, y0);
    g.stroke();
    g.globalAlpha = 1;
    label(g, Math.round(d) + '', px, y0 + 16, C.faint, 'center');
  }
  // altitude ticks
  const hs = niceStep(maxH - minH, 4);
  for (let v = Math.ceil(minH / hs) * hs; v <= maxH; v += hs) {
    const py = Y(v);
    g.strokeStyle = C.hair;
    g.globalAlpha = 0.35;
    g.beginPath();
    g.moveTo(x0, py);
    g.lineTo(x1, py);
    g.stroke();
    g.globalAlpha = 1;
    label(g, v.toFixed(0), x0 - 7, py + 3, C.faint, 'right');
  }
  axes(g, x0, y1, x1, y0);
  label(g, 'DIST TO TARGET (m)', (x0 + x1) / 2, h - 4, C.muted, 'center');

  // ideal slope wedge
  g.strokeStyle = C.course;
  g.lineWidth = 2;
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(X(0), Y(0));
  g.lineTo(X(maxD), Y(maxD * Math.tan((SLOPE * Math.PI) / 180)));
  g.stroke();
  // ground
  g.strokeStyle = C.faint;
  g.globalAlpha = 0.6;
  g.beginPath();
  g.moveTo(x0, Y(0));
  g.lineTo(x1, Y(0));
  g.stroke();
  g.globalAlpha = 1;

  // flown path, coloured by vertical deviation
  g.lineWidth = 2.4;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1],
      b = rows[i];
    const dev = b.vdev!;
    g.strokeStyle = dev > 3 ? C.high : dev < -3 ? C.low : C.track;
    g.beginPath();
    g.moveTo(X(a.dist!), Y(a.h!));
    g.lineTo(X(b.dist!), Y(b.h!));
    g.stroke();
  }
  // aircraft marker at farthest point
  const far = rows[0];
  g.fillStyle = C.track;
  g.beginPath();
  g.arc(X(far.dist!), Y(far.h!), 3.5, 0, 7);
  g.fill();
  // target marker
  g.fillStyle = C.course;
  g.beginPath();
  g.moveTo(X(0), Y(0) - 6);
  g.lineTo(X(0) - 5, Y(0));
  g.lineTo(X(0) + 5, Y(0));
  g.fill();
}

export function ProfileChart({ segment, slope }: ProfileChartProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function draw() {
      if (ref.current) drawProfile(ref.current, segment, slope);
    }
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [segment, slope]);

  return <canvas ref={ref} height={HEIGHT} />;
}
