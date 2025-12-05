// ─────────────────────────────────────────────────────────────────────────────
// ComponentSVG – renders an individual hydronic component on the canvas
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { HydronicComponent } from '../../types';
import { BoilerSVG } from './shapes/BoilerSVG';
import { PumpSVG } from './shapes/PumpSVG';
import { BaseboardSVG } from './shapes/BaseboardSVG';
import { ExpansionTankSVG } from './shapes/ExpansionTankSVG';
import { ZoneValveSVG } from './shapes/ZoneValveSVG';
import { RadiantFloorSVG } from './shapes/RadiantFloorSVG';
import { GenericSVG } from './shapes/GenericSVG';

interface Props {
  component: HydronicComponent;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const ComponentSVG: React.FC<Props> = ({ component, selected, onMouseDown }) => {
  const { id, type, position, rotation, flippedH, flippedV, name } = component;

  const transform = [
    `translate(${position.x}, ${position.y})`,
    rotation ? `rotate(${rotation})` : '',
    flippedH ? 'scale(-1,1)' : '',
    flippedV ? 'scale(1,-1)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  let Shape: React.FC<{ component: HydronicComponent }>;
  switch (type) {
    case 'boiler_gas':
    case 'boiler_oil':
    case 'boiler_electric':
      Shape = BoilerSVG;
      break;
    case 'pump_fixed':
    case 'pump_variable':
    case 'zone_pump':
      Shape = PumpSVG;
      break;
    case 'baseboard':
      Shape = BaseboardSVG;
      break;
    case 'expansion_tank':
      Shape = ExpansionTankSVG;
      break;
    case 'zone_valve_2way':
    case 'zone_valve_3way':
      Shape = ZoneValveSVG;
      break;
    case 'radiant_floor':
      Shape = RadiantFloorSVG;
      break;
    default:
      Shape = GenericSVG;
  }

  return (
    <g
      id={id}
      className="component"
      transform={transform}
      onMouseDown={onMouseDown}
      style={{ cursor: 'move' }}
    >
      <Shape component={component} />
      {selected && (
        <rect
          x={-4}
          y={-4}
          width={88}
          height={68}
          fill="none"
          stroke="#2196f3"
          strokeWidth={2}
          strokeDasharray="4 2"
          pointerEvents="none"
        />
      )}
      <text x={40} y={70} textAnchor="middle" fontSize={10} fill="#333">
        {name}
      </text>
    </g>
  );
};
