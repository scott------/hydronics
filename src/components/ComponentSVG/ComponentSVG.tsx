// ─────────────────────────────────────────────────────────────────────────────
// ComponentSVG – renders an individual hydronic component on the canvas
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { HydronicComponent, Position, BaseboardComponent } from '../../types';
import { PortCircle } from '../PortCircle';
import {
  BoilerSVG,
  BOILER_PORTS,
  PumpSVG,
  PUMP_PORTS,
  BaseboardSVG,
  getBaseboardPorts,
  ExpansionTankSVG,
  EXPANSION_TANK_PORTS,
  ZoneValveSVG,
  ZONE_VALVE_PORTS,
  RadiantFloorSVG,
  RADIANT_FLOOR_PORTS,
  GenericSVG,
  GENERIC_PORTS,
} from './shapes';

/** Port definition for shapes */
export interface ShapePort {
  id: string;
  type: 'supply' | 'return' | 'general';
  cx: number;
  cy: number;
}

interface Props {
  component: HydronicComponent;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

/** Calculate absolute position of a port given component transform */
function getAbsolutePortPosition(
  port: ShapePort,
  position: Position,
  rotation: number,
  flippedH: boolean,
  flippedV: boolean
): Position {
  let { cx, cy } = port;

  // Apply flips first (around component origin)
  if (flippedH) cx = -cx;
  if (flippedV) cy = -cy;

  // Apply rotation
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = cx * cos - cy * sin;
  const ry = cx * sin + cy * cos;

  return {
    x: position.x + rx,
    y: position.y + ry,
  };
}

/** Get port definitions for a component type */
function getPortsForComponent(component: HydronicComponent): ShapePort[] {
  switch (component.type) {
    case 'boiler_gas':
    case 'boiler_oil':
    case 'boiler_electric':
      return BOILER_PORTS;
    case 'pump_fixed':
    case 'pump_variable':
    case 'zone_pump':
      return PUMP_PORTS;
    case 'baseboard': {
      const props = (component as BaseboardComponent).props;
      const width = Math.min(200, Math.max(60, (props?.lengthFt ?? 4) * 15));
      return getBaseboardPorts(width);
    }
    case 'expansion_tank':
      return EXPANSION_TANK_PORTS;
    case 'zone_valve_2way':
    case 'zone_valve_3way':
      return ZONE_VALVE_PORTS;
    case 'radiant_floor':
      return RADIANT_FLOOR_PORTS;
    default:
      return GENERIC_PORTS;
  }
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

  // Get port definitions for this component
  const ports = getPortsForComponent(component);

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
      {/* Interactive port circles */}
      {ports.map((port) => (
        <PortCircle
          key={port.id}
          componentId={id}
          portId={port.id}
          type={port.type}
          cx={port.cx}
          cy={port.cy}
          absolutePosition={getAbsolutePortPosition(port, position, rotation, flippedH, flippedV)}
        />
      ))}
      <text x={40} y={70} textAnchor="middle" fontSize={10} fill="#333">
        {name}
      </text>
    </g>
  );
};
