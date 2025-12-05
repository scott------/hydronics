// ─────────────────────────────────────────────────────────────────────────────
// PipeSVG – renders pipes/connections on the canvas
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { Pipe } from '../../types';

interface Props {
  pipe: Pipe;
  selected: boolean;
}

export const PipeSVG: React.FC<Props> = ({ pipe, selected }) => {
  if (pipe.waypoints.length < 2) return null;

  const d = pipe.waypoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const strokeColor = pipe.pipeType === 'supply' ? '#ef5350' : '#42a5f5';
  const strokeWidth = selected ? 6 : 4;

  return (
    <g className="pipe" id={pipe.id}>
      {/* Background for selection hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
      {/* Visible pipe */}
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {selected && (
        <path
          d={d}
          fill="none"
          stroke="#2196f3"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />
      )}
    </g>
  );
};
