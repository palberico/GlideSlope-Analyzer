export const DPR = Math.max(1, window.devicePixelRatio || 1);

export const C = {
  course: '#E255A1',
  track: '#46C6E0',
  high: '#F2A93B',
  low: '#E5687A',
  on: '#5FD08A',
  hair: '#24303d',
  muted: '#8B98A5',
  faint: '#5A6773',
  text: '#E6EDF3',
};

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Sizes a canvas's backing store for the current DPR and returns its 2D context.
 *
 * `height` must be the element's stable, intended CSS height — not read back from
 * `cv.height`/`cv.getAttribute('height')`. Those are spec-reflected: writing them (as
 * this function does, to set the backing-store size) changes what a later read of the
 * attribute returns. Re-deriving the design height from the attribute after it's been
 * written compounds by DPR on every call, which blows past the browser's max canvas
 * size within a handful of animation frames in any loop that calls fit() repeatedly
 * (e.g. the CDI replay) — the canvas then renders blank because its context is lost.
 */
export function fit(cv: HTMLCanvasElement, height: number) {
  const w = cv.clientWidth;
  const h = height;
  cv.width = w * DPR;
  cv.height = h * DPR;
  const g = cv.getContext('2d')!;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { g, w, h };
}

export function axes(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  g.strokeStyle = C.hair;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x0, y1);
  g.lineTo(x1, y1);
  g.stroke();
}

export function label(
  g: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  col: string,
  align: CanvasTextAlign = 'left',
  size = 10.5
) {
  g.fillStyle = col;
  g.font = size + 'px ui-monospace,monospace';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(t, x, y);
}

export function niceStep(range: number, target: number): number {
  const raw = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return s * pow;
}

export function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function dot(g: CanvasRenderingContext2D, x: number, y: number) {
  g.beginPath();
  g.arc(x, y, 2, 0, 7);
  g.fill();
}

/** Draws a course deviation indicator (dark dial + crosshair + needles) at the given deviations. */
export function drawCDI(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  cross: number,
  vdev: number,
  latFullScale = 40,
  vertFullScale = 20
) {
  g.clearRect(0, 0, w, h);
  const MAX = (Math.min(w, h) - 28) / 2,
    cx = w / 2,
    cy = h / 2;
  g.fillStyle = '#0b0f16';
  roundRect(g, cx - MAX - 10, cy - MAX - 10, (MAX + 10) * 2, (MAX + 10) * 2, 12);
  g.fill();
  g.strokeStyle = C.hair;
  g.setLineDash([2, 5]);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(cx - MAX, cy);
  g.lineTo(cx + MAX, cy);
  g.moveTo(cx, cy - MAX);
  g.lineTo(cx, cy + MAX);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = C.faint;
  [-0.66, -0.33, 0.33, 0.66].forEach((o) => {
    dot(g, cx + o * MAX, cy);
    dot(g, cx, cy + o * MAX);
  });
  const dx = clamp(-cross / latFullScale, -1, 1) * MAX; // right of course -> needle left
  const dy = clamp(vdev / vertFullScale, -1, 1) * MAX; // high -> needle down
  g.strokeStyle = C.on;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx + dx, cy - MAX);
  g.lineTo(cx + dx, cy + MAX);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - MAX, cy + dy);
  g.lineTo(cx + MAX, cy + dy);
  g.stroke();
  g.lineCap = 'butt';
  g.fillStyle = C.low;
  g.fillRect(cx - 4, cy - 4, 8, 8);
}
