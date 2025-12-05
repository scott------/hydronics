// Radiant Floor Zone SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';

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
    {/* Supply port (top-left) */}
    <circle cx={10} cy={0} r={5} fill="#ef5350" stroke="#b71c1c" strokeWidth={1} />
    {/* Return port (bottom-left) */}
    <circle cx={70} cy={60} r={5} fill="#42a5f5" stroke="#1565c0" strokeWidth={1} />
  </g>
);
