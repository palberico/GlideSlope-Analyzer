import { useEffect, useRef, useState } from 'react';
import type { Row, Segment } from '../lib/csv';
import { drawCDI, fit } from '../lib/canvas';

interface CDIReplayProps {
  segment: Segment;
}

const HEIGHT = 300;

interface Sample {
  dist: number;
  cross: number;
  vdev: number;
  h: number;
  tgt: number;
}

export function CDIReplay({ segment }: CDIReplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rowsRef = useRef<Row[]>([]);
  const t0Ref = useRef(0);
  const t1Ref = useRef(0);
  const headRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const scrubbingRef = useRef(false);
  const speedRef = useRef(1);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [scrubValue, setScrubValue] = useState(0);
  const [readout, setReadout] = useState('');

  function drawCDIcore(cross: number, vdev: number) {
    const cv = canvasRef.current;
    if (!cv) return;
    const { g, w, h } = fit(cv, HEIGHT);
    if (!w) return;
    drawCDI(g, w, h, cross, vdev);
  }

  function sampleAt(T: number): Sample {
    const rows = rowsRef.current;
    if (T <= rows[0].ms!) return rows[0] as Sample;
    const last = rows[rows.length - 1];
    if (T >= last.ms!) return last as Sample;
    let lo = 0,
      hi = rows.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (rows[m].ms! <= T) lo = m;
      else hi = m;
    }
    const a = rows[lo],
      b = rows[hi],
      f = (T - a.ms!) / (b.ms! - a.ms! || 1);
    const L = (k: keyof Row) => (a[k] as number) + ((b[k] as number) - (a[k] as number)) * f;
    return { dist: L('dist'), cross: L('cross'), vdev: L('vdev'), h: L('h'), tgt: L('tgt') };
  }

  function drawCDIat(T: number) {
    if (rowsRef.current.length < 2) {
      drawCDIcore(0, 0);
      setReadout('');
      return;
    }
    const s = sampleAt(T);
    drawCDIcore(s.cross, s.vdev);
    const el = (T - t0Ref.current) / 1000,
      tot = (t1Ref.current - t0Ref.current) / 1000;
    setReadout(
      `t ${el.toFixed(1)}/${tot.toFixed(0)}s   dist ${s.dist.toFixed(0)}m   ` +
        `${Math.abs(s.vdev).toFixed(0)}m ${s.vdev >= 0 ? 'HIGH' : 'LOW'}   ` +
        `${Math.abs(s.cross).toFixed(0)}m ${s.cross >= 0 ? 'R' : 'L'}`
    );
    if (!scrubbingRef.current) {
      setScrubValue(Math.round(((T - t0Ref.current) / (t1Ref.current - t0Ref.current || 1)) * 1000));
    }
  }

  function stop() {
    setPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }

  function tick(now: number) {
    headRef.current += (now - lastRef.current) * speedRef.current;
    lastRef.current = now;
    if (headRef.current >= t1Ref.current) {
      headRef.current = t1Ref.current;
      drawCDIat(headRef.current);
      stop();
      return;
    }
    drawCDIat(headRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }

  function play() {
    if (rowsRef.current.length < 2) return;
    if (headRef.current >= t1Ref.current) headRef.current = t0Ref.current;
    setPlaying(true);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }

  // (re)initialize replay whenever the selected segment changes
  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    rowsRef.current = segment.rows.filter((r) => r.ms !== null && r.dist !== null);
    setScrubValue(0);
    scrubbingRef.current = false;
    if (rowsRef.current.length < 2) {
      t0Ref.current = t1Ref.current = headRef.current = 0;
      drawCDIcore(0, 0);
      setReadout('');
      return;
    }
    t0Ref.current = rowsRef.current[0].ms!;
    t1Ref.current = rowsRef.current[rowsRef.current.length - 1].ms!;
    headRef.current = t0Ref.current;
    drawCDIat(headRef.current);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment]);

  // redraw (without resetting replay position) when the container resizes
  useEffect(() => {
    function onResize() {
      drawCDIat(headRef.current);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="cdi" height={HEIGHT} />
      <div className="rpread mono">{readout}</div>
      <div className="rpctrl">
        <button className="ghost" onClick={() => (playing ? stop() : play())}>
          {playing ? 'Pause' : headRef.current >= t1Ref.current && t1Ref.current > 0 ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={scrubValue}
          aria-label="Scrub replay"
          onChange={(e) => {
            scrubbingRef.current = true;
            if (playing) stop();
            const v = Number(e.target.value);
            setScrubValue(v);
            headRef.current = t0Ref.current + (v / 1000) * (t1Ref.current - t0Ref.current || 0);
            drawCDIat(headRef.current);
          }}
          onMouseUp={() => (scrubbingRef.current = false)}
          onTouchEnd={() => (scrubbingRef.current = false)}
        />
        <select
          aria-label="Replay speed"
          value={speed}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setSpeed(v);
            speedRef.current = v;
          }}
        >
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </div>
    </>
  );
}
