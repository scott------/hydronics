// Zone Valve SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';

export const ZoneValveSVG: React.FC<{ component: HydronicComponent }> = () => (
  <g>
    {/* Valve body */}
    <rect x={10} y={15} width={40} height={30} rx={3} fill="#b0bec5" stroke="#546e7a" strokeWidth={2} />
    {/* Actuator */}
    <rect x={20} y={0} width={20} height={15} rx={2} fill="#78909c" stroke="#455a64" strokeWidth={1} />
    {/* Arrow */}
    <path d="M25 30 L35 25 L35 35 Z" fill="#37474f" />
    {/* Inlet port (left) */}
    <circle cx={0} cy={30} r={5} fill="#42a5f5" stroke="#1565c0" strokeWidth={1} />
    {/* Outlet port (right) */}
    <circle cx={60} cy={30} r={5} fill="#ef5350" stroke="#b71c1c" strokeWidth={1} />
  </g>
);
