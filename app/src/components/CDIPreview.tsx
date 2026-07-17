import { useEffect, useRef } from 'react';
import { drawCDI, fit } from '../lib/canvas';

const HEIGHT = 200;

/** A small, continuously-sweeping CDI, purely decorative — shows what the real replay looks like. */
export function CDIPreview() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf: number;
    function tick(t: number) {
      const cv = ref.current;
      if (cv) {
        const { g, w, h } = fit(cv, HEIGHT);
        if (w) {
          const cross = Math.sin(t / 1400) * 18;
          const vdev = Math.sin(t / 2200 + 1) * 9;
          drawCDI(g, w, h, cross, vdev);
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hero-cdi">
      <canvas ref={ref} height={HEIGHT} aria-label="Animated preview of the course deviation indicator" />
      <p>Live CDI</p>
    </div>
  );
}
