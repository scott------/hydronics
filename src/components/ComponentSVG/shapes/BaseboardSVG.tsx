// Baseboard SVG shape with heat wave animation
import React from 'react';
import type { HydronicComponent, BaseboardComponent, ComponentSimState } from '../../../types';
import type { ShapePort } from '../ComponentSVG';

/** Get port definitions for baseboard (width varies with length) */
export function getBaseboardPorts(width: number): ShapePort[] {
  return [
    { id: 'supply', type: 'supply', cx: 0, cy: 30 },
    { id: 'return', type: 'return', cx: width, cy: 30 },
  ];
}

interface Props {
  component: HydronicComponent;
  simActive?: boolean;
  simState?: ComponentSimState;
}

export const BaseboardSVG: React.FC<Props> = ({ component, simActive = false }) => {
  const props = (component as BaseboardComponent).props;
  const width = Math.min(200, Math.max(60, (props?.lengthFt ?? 4) * 15));
  const finCount = Math.floor(width / 10);
  
  return (
    <g>
      {/* Housing */}
      <rect 
        x={0} y={10} width={width} height={40} rx={2} 
        fill={simActive ? '#d7ccc8' : '#bcaaa4'} 
        stroke={simActive ? '#8d6e63' : '#6d4c41'} 
        strokeWidth={2} 
      />
      {/* Fins - glow when active */}
      {Array.from({ length: finCount }).map((_, i) => (
        <line
          key={i}
          x1={5 + i * 10}
          y1={15}
          x2={5 + i * 10}
          y2={45}
          stroke={simActive ? '#ff7043' : '#8d6e63'}
          strokeWidth={simActive ? 2 : 1}
        />
      ))}
      {/* Heat waves rising when active */}
      {simActive && (
        <g className="heat-wave">
          {Array.from({ length: Math.floor(finCount / 2) }).map((_, i) => (
            <path
              key={i}
              d={`M ${15 + i * 20} 5 Q ${18 + i * 20} 0 ${21 + i * 20} 5 Q ${24 + i * 20} 10 ${27 + i * 20} 5`}
              fill="none"
              stroke="#ff5722"
              strokeWidth={1.5}
              opacity={0.6}
            />
          ))}
        </g>
      )}
      {/* Active indicator glow */}
      {simActive && (
        <rect 
          x={-2} y={8} width={width + 4} height={44} rx={3} 
          fill="none" stroke="#ff5722" strokeWidth={2} opacity={0.4} 
        />
      )}
    </g>
  );
};
