// Generic fallback SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';

export const GenericSVG: React.FC<{ component: HydronicComponent }> = ({ component }) => (
  <g>
    <rect x={0} y={0} width={60} height={60} rx={4} fill="#e0e0e0" stroke="#9e9e9e" strokeWidth={2} />
    <text x={30} y={35} textAnchor="middle" fontSize={9} fill="#616161">
      {component.type.slice(0, 8)}
    </text>
    {/* Generic ports */}
    <circle cx={0} cy={30} r={5} fill="#bdbdbd" stroke="#757575" strokeWidth={1} />
    <circle cx={60} cy={30} r={5} fill="#bdbdbd" stroke="#757575" strokeWidth={1} />
  </g>
);
