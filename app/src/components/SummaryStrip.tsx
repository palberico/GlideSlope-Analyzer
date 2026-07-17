import type { ReactNode } from 'react';

interface SummaryStripProps {
  rowCount: number;
  durationSec: number;
  slope: number;
  approachCount: number;
}

export function SummaryStrip({ rowCount, durationSec, slope, approachCount }: SummaryStripProps) {
  const cells: [string, ReactNode][] = [
    ['Rows', rowCount],
    [
      'Duration',
      <>
        {durationSec.toFixed(0)}
        <small>s</small>
      </>,
    ],
    [
      'Slope',
      <>
        {slope.toFixed(1)}
        <small>°</small>
      </>,
    ],
    ['Approaches', approachCount || '—'],
  ];

  return (
    <div className="strip">
      {cells.map(([k, v], i) => (
        <div className="cell" key={i}>
          <div className="k">{k}</div>
          <div className="v mono">{v}</div>
        </div>
      ))}
    </div>
  );
}
