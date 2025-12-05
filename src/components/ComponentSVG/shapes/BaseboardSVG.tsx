// Baseboard SVG shape
import React from 'react';
import type { HydronicComponent, BaseboardComponent } from '../../../types';

export const BaseboardSVG: React.FC<{ component: HydronicComponent }> = ({ component }) => {
  const props = (component as BaseboardComponent).props;
  const width = Math.min(200, Math.max(60, (props?.lengthFt ?? 4) * 15));
  return (
    <g>
      {/* Housing */}
      <rect x={0} y={10} width={width} height={40} rx={2} fill="#bcaaa4" stroke="#6d4c41" strokeWidth={2} />
      {/* Fins */}
      {Array.from({ length: Math.floor(width / 10) }).map((_, i) => (
        <line
          key={i}
          x1={5 + i * 10}
          y1={15}
          x2={5 + i * 10}
          y2={45}
          stroke="#8d6e63"
          strokeWidth={1}
        />
      ))}
      {/* Supply port (left) */}
      <circle cx={0} cy={30} r={5} fill="#ef5350" stroke="#b71c1c" strokeWidth={1} />
      {/* Return port (right) */}
      <circle cx={width} cy={30} r={5} fill="#42a5f5" stroke="#1565c0" strokeWidth={1} />
    </g>
  );
};
