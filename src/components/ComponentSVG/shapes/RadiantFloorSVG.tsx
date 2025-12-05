// Radiant Floor Zone SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for radiant floor */
export const RADIANT_FLOOR_PORTS: ShapePort[] = [
  { id: 'supply', type: 'supply', cx: 10, cy: 0 },
  { id: 'return', type: 'return', cx: 70, cy: 60 },
];

export const RadiantFloorSVG: React.FC<{ component: HydronicComponent }> = () => (
  <g>
    {/* Floor area */}
    <rect x={0} y={0} width={80} height={60} fill="#e8f5e9" stroke="#66bb6a" strokeWidth={2} />
    {/* Serpentine tubing */}
    <path
      d="M10 10 L70 10 L70 20 L10 20 L10 30 L70 30 L70 40 L10 40 L10 50 L70 50"
      fill="none"
      stroke="#ef6c00"
      strokeWidth={2}
    />
  </g>
);
