// Boiler SVG shape with flame animation
import React from 'react';
import type { HydronicComponent, ComponentSimState } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for boiler component */
export const BOILER_PORTS: ShapePort[] = [
  { id: 'supply', type: 'supply', cx: 15, cy: 0 },
  { id: 'return', type: 'return', cx: 65, cy: 0 },
];

interface Props {
  component: HydronicComponent;
  simActive?: boolean;
  simState?: ComponentSimState;
}

export const BoilerSVG: React.FC<Props> = ({ simActive = false }) => {
  // When simulation is active, boiler is firing
  const isFiring = simActive;
  
  return (
    <g>
      {/* Body */}
      <rect 
        x={0} y={0} width={80} height={60} rx={4} 
        fill={isFiring ? '#ff8a80' : '#e57373'} 
        stroke={isFiring ? '#d32f2f' : '#c62828'} 
        strokeWidth={2} 
      />
      {/* Flame icon - animated when firing */}
      <g className={isFiring ? 'flame-active' : ''}>
        {/* Main flames */}
        <path
          d="M40 15 Q48 25 40 38 Q32 25 40 15"
          fill={isFiring ? '#ff9800' : 'none'}
          stroke={isFiring ? '#f57c00' : '#ff9800'}
          strokeWidth={2}
        />
        {/* Left flame */}
        <path
          d="M32 22 Q36 30 32 38 Q28 30 32 22"
          fill={isFiring ? '#ffb74d' : 'none'}
          stroke={isFiring ? '#ff9800' : '#ff9800'}
          strokeWidth={1.5}
        />
        {/* Right flame */}
        <path
          d="M48 22 Q52 30 48 38 Q44 30 48 22"
          fill={isFiring ? '#ffb74d' : 'none'}
          stroke={isFiring ? '#ff9800' : '#ff9800'}
          strokeWidth={1.5}
        />
      </g>
      {/* Heat glow when firing */}
      {isFiring && (
        <>
          <rect 
            x={-2} y={-2} width={84} height={64} rx={5} 
            fill="none" stroke="#ff5722" strokeWidth={2} opacity={0.4} 
          />
          {/* Inner glow */}
          <rect 
            x={5} y={42} width={70} height={14} rx={2} 
            fill="#ff5722" opacity={0.3} 
          />
        </>
      )}
      {/* Status indicator */}
      <circle cx={70} cy={10} r={4} fill={isFiring ? '#4caf50' : '#9e9e9e'} />
    </g>
  );
};
