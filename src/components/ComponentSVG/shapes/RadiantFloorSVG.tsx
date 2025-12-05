// Radiant Floor Zone SVG shape with heat glow animation
import React from 'react';
import type { HydronicComponent, ComponentSimState } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for radiant floor */
export const RADIANT_FLOOR_PORTS: ShapePort[] = [
  { id: 'supply', type: 'supply', cx: 10, cy: 0 },
  { id: 'return', type: 'return', cx: 70, cy: 60 },
];

interface Props {
  component: HydronicComponent;
  simActive?: boolean;
  simState?: ComponentSimState;
}

export const RadiantFloorSVG: React.FC<Props> = ({ simActive = false }) => (
  <g>
    {/* Floor area - warmer color when active */}
    <rect 
      x={0} y={0} width={80} height={60} 
      fill={simActive ? '#fff3e0' : '#e8f5e9'} 
      stroke={simActive ? '#ff9800' : '#66bb6a'} 
      strokeWidth={2} 
    />
    {/* Serpentine tubing - animated glow when active */}
    <path
      d="M10 10 L70 10 L70 20 L10 20 L10 30 L70 30 L70 40 L10 40 L10 50 L70 50"
      fill="none"
      stroke={simActive ? '#ff5722' : '#ef6c00'}
      strokeWidth={simActive ? 3 : 2}
      className={simActive ? 'flow-forward' : ''}
    />
    {/* Heat radiation effect when active */}
    {simActive && (
      <>
        {/* Radiant heat glow */}
        <rect 
          x={2} y={2} width={76} height={56} 
          fill="#ff9800" 
          opacity={0.15}
          rx={2}
        />
        {/* Heat waves */}
        <g className="heat-wave">
          <path
            d="M20 -5 Q 25 -10 30 -5 Q 35 0 40 -5"
            fill="none"
            stroke="#ff5722"
            strokeWidth={1.5}
            opacity={0.5}
          />
          <path
            d="M50 -5 Q 55 -10 60 -5 Q 65 0 70 -5"
            fill="none"
            stroke="#ff5722"
            strokeWidth={1.5}
            opacity={0.5}
          />
        </g>
        {/* Active indicator glow */}
        <rect 
          x={-2} y={-2} width={84} height={64} 
          fill="none" stroke="#ff9800" strokeWidth={2} opacity={0.5} 
        />
      </>
    )}
  </g>
);
