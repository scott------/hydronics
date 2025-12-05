// Boiler SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for boiler component */
export const BOILER_PORTS: ShapePort[] = [
  { id: 'supply', type: 'supply', cx: 15, cy: 0 },
  { id: 'return', type: 'return', cx: 65, cy: 0 },
];

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
  </g>
);
