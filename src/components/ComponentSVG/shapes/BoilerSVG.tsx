// Boiler SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';

export const BoilerSVG: React.FC<{ component: HydronicComponent }> = () => (
  <g>
    {/* Body */}
    <rect x={0} y={0} width={80} height={60} rx={4} fill="#e57373" stroke="#c62828" strokeWidth={2} />
    {/* Flame icon */}
    <path
      d="M40 15 Q45 25 40 35 Q35 25 40 15 M35 20 Q38 28 35 35 M45 20 Q42 28 45 35"
      fill="none"
      stroke="#ff9800"
      strokeWidth={2}
    />
    {/* Supply port (top-left) */}
    <circle cx={15} cy={0} r={5} fill="#ef5350" stroke="#b71c1c" strokeWidth={1} />
    {/* Return port (top-right) */}
    <circle cx={65} cy={0} r={5} fill="#42a5f5" stroke="#1565c0" strokeWidth={1} />
  </g>
);
