// ─────────────────────────────────────────────────────────────────────────────
// PipeSVG – renders pipes/connections on the canvas with animated flow
// Flow direction is determined by the pipe's waypoints (from startPort to endPort).
// The animation always moves in the direction the path is drawn (forward along waypoints).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { Pipe } from '../../types';

interface Props {
  pipe: Pipe;
  selected: boolean;
  animated?: boolean;
  /** If true, reverse the animation direction (used when actual flow is opposite to path direction) */
  reverseFlow?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const PipeSVG: React.FC<Props> = ({ pipe, selected, animated = false, reverseFlow = false, onClick }) => {
  if (pipe.waypoints.length < 2) return null;

  const d = pipe.waypoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const strokeColor = pipe.pipeType === 'supply' ? '#ef5350' : '#42a5f5';
  const strokeWidth = selected ? 6 : 4;
  
  // Flow animation: forward follows the path direction (start → end waypoints)
  // In hydronic systems, flow direction is: pump outlet → emitters (supply) → back to boiler (return)
  // Pipes are drawn from their connection's "from" component to "to" component
  const flowClass = animated 
    ? (reverseFlow ? 'flow-reverse' : 'flow-forward')
    : '';

  return (
    <g className="pipe" id={pipe.id} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Background for selection hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }} />
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
