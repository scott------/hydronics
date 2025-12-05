// Expansion Tank SVG shape
import React from 'react';
import type { HydronicComponent } from '../../../types';

export const ExpansionTankSVG: React.FC<{ component: HydronicComponent }> = () => (
  <g>
    {/* Oval body */}
    <ellipse cx={30} cy={30} rx={25} ry={30} fill="#fff59d" stroke="#f9a825" strokeWidth={2} />
    {/* Diaphragm line */}
    <line x1={5} y1={30} x2={55} y2={30} stroke="#fbc02d" strokeWidth={2} strokeDasharray="4 2" />
    {/* Air label */}
    <text x={30} y={20} textAnchor="middle" fontSize={8} fill="#666">
      Air
    </text>
    {/* Water label */}
    <text x={30} y={45} textAnchor="middle" fontSize={8} fill="#1976d2">
      Water
    </text>
    {/* Port (bottom) */}
    <circle cx={30} cy={60} r={5} fill="#42a5f5" stroke="#1565c0" strokeWidth={1} />
  </g>
);
