// Zone Valve SVG shape with open/close animation
import React from 'react';
import type { HydronicComponent, ComponentSimState } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Port definitions for zone valve */
export const ZONE_VALVE_PORTS: ShapePort[] = [
  { id: 'inlet', type: 'return', cx: 0, cy: 30 },
  { id: 'outlet', type: 'supply', cx: 60, cy: 30 },
];

interface Props {
  component: HydronicComponent;
  simActive?: boolean;
  simState?: ComponentSimState;
}

export const ZoneValveSVG: React.FC<Props> = ({ simActive = false }) => {
  // When simulation is active, valve is considered open
  const isOpen = simActive;
  
  return (
    <g>
      {/* Valve body */}
      <rect 
        x={10} y={15} width={40} height={30} rx={3} 
        fill={isOpen ? '#c8e6c9' : '#b0bec5'} 
        stroke={isOpen ? '#4caf50' : '#546e7a'} 
        strokeWidth={2} 
        className={isOpen ? 'valve-open' : ''}
      />
      {/* Actuator */}
      <rect x={20} y={0} width={20} height={15} rx={2} fill="#78909c" stroke="#455a64" strokeWidth={1} />
      {/* Flow indicator - arrow shows when open */}
      <path 
        d="M25 30 L35 25 L35 35 Z" 
        fill={isOpen ? '#4caf50' : '#37474f'} 
      />
      {/* Status indicator light */}
      <circle 
        cx={30} cy={7} r={3} 
        fill={isOpen ? '#4caf50' : '#f44336'} 
      />
      {/* Open indicator glow */}
      {isOpen && (
        <rect 
          x={8} y={13} width={44} height={34} rx={4} 
          fill="none" stroke="#4caf50" strokeWidth={2} opacity={0.5} 
        />
      )}
    </g>
  );
};
