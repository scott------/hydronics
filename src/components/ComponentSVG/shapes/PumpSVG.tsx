// Pump SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';

export const PumpSVG: React.FC<{ component: HydronicComponent }> = () => (
  <g>
    {/* Circle body */}
    <circle cx={30} cy={30} r={25} fill="#90caf9" stroke="#1565c0" strokeWidth={2} />
    {/* Impeller */}
    <path
      d="M30 15 L35 30 L30 45 L25 30 Z"
      fill="#1976d2"
      stroke="#0d47a1"
      strokeWidth={1}
    />
    {/* Inlet port (left) */}
    <circle cx={0} cy={30} r={5} fill="#42a5f5" stroke="#1565c0" strokeWidth={1} />
    {/* Outlet port (right) */}
    <circle cx={60} cy={30} r={5} fill="#ef5350" stroke="#b71c1c" strokeWidth={1} />
    {/* Direction arrow */}
    <path d="M50 30 L55 25 L55 35 Z" fill="#1565c0" />
  </g>
);
