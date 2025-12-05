// Pump SVG shape with rotation animation
import React from 'react';
import type { HydronicComponent, ComponentSimState } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for pump component */
export const PUMP_PORTS: ShapePort[] = [
  { id: 'inlet', type: 'return', cx: 0, cy: 30 },
  { id: 'outlet', type: 'supply', cx: 60, cy: 30 },
];

interface Props {
  component: HydronicComponent;
  simActive?: boolean;
  simState?: ComponentSimState;
}

export const PumpSVG: React.FC<Props> = ({ simActive = false }) => (
  <g>
    {/* Circle body */}
    <circle cx={30} cy={30} r={25} fill="#90caf9" stroke="#1565c0" strokeWidth={2} />
    {/* Impeller - rotates when simulation is active */}
    <g className={simActive ? 'pump-impeller-spinning' : ''}>
      <path
        d="M30 15 L35 30 L30 45 L25 30 Z"
        fill="#1976d2"
        stroke="#0d47a1"
        strokeWidth={1}
      />
      {/* Additional impeller blades for better visual */}
      <path
        d="M15 30 L30 35 L45 30 L30 25 Z"
        fill="#1976d2"
        stroke="#0d47a1"
        strokeWidth={1}
      />
    </g>
    {/* Direction arrow */}
    <path d="M50 30 L55 25 L55 35 Z" fill="#1565c0" />
    {/* Running indicator glow */}
    {simActive && (
      <circle cx={30} cy={30} r={27} fill="none" stroke="#4caf50" strokeWidth={2} opacity={0.6} />
    )}
  </g>
);
