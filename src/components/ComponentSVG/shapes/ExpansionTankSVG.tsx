// Expansion Tank SVG shape
import React from 'react';
import type { HydronicComponent, ComponentSimState } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for expansion tank */
export const EXPANSION_TANK_PORTS: ShapePort[] = [
  { id: 'connection', type: 'general', cx: 30, cy: 60 },
];

interface Props {
  component: HydronicComponent;
  simActive?: boolean;
  simState?: ComponentSimState;
}

export const ExpansionTankSVG: React.FC<Props> = ({ simActive = false }) => (
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
    {/* Active indicator */}
    {simActive && (
      <ellipse cx={30} cy={30} rx={27} ry={32} fill="none" stroke="#4caf50" strokeWidth={1.5} opacity={0.5} />
    )}
  </g>
);
