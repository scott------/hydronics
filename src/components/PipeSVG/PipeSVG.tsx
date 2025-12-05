// ─────────────────────────────────────────────────────────────────────────────
// PipeSVG – renders pipes/connections on the canvas with animated flow
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { Pipe } from '../../types';

interface Props {
  pipe: Pipe;
  selected: boolean;
  animated?: boolean;
}

export const PipeSVG: React.FC<Props> = ({ pipe, selected, animated = false }) => {
  if (pipe.waypoints.length < 2) return null;

  const d = pipe.waypoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const strokeColor = pipe.pipeType === 'supply' ? '#ef5350' : '#42a5f5';
  const strokeWidth = selected ? 6 : 4;
  const flowClass = animated 
    ? (pipe.pipeType === 'supply' ? 'flow-supply' : 'flow-return')
    : '';

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
        className={flowClass}
      />
      {/* Animated flow overlay when simulation is running */}
      {animated && (
        <path
          d={d}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={flowClass}
          opacity={0.6}
        />
      )}
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
