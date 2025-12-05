// Zone Valve SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for zone valve */
export const ZONE_VALVE_PORTS: ShapePort[] = [
  { id: 'inlet', type: 'return', cx: 0, cy: 30 },
  { id: 'outlet', type: 'supply', cx: 60, cy: 30 },
];

export const ZoneValveSVG: React.FC<{ component: HydronicComponent }> = () => (
  <g>
    {/* Valve body */}
    <rect x={10} y={15} width={40} height={30} rx={3} fill="#b0bec5" stroke="#546e7a" strokeWidth={2} />
    {/* Actuator */}
    <rect x={20} y={0} width={20} height={15} rx={2} fill="#78909c" stroke="#455a64" strokeWidth={1} />
    {/* Arrow */}
    <path d="M25 30 L35 25 L35 35 Z" fill="#37474f" />
  </g>
);
