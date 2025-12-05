// ─────────────────────────────────────────────────────────────────────────────
// Palette – draggable component library
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useStore } from '../../store';
import type { ComponentType, Port } from '../../types';
import styles from './Palette.module.css';

interface PaletteItem {
  type: ComponentType;
  label: string;
  category: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Heat Sources
  { type: 'boiler_gas', label: 'Gas Boiler', category: 'Heat Sources' },
  { type: 'boiler_electric', label: 'Electric Boiler', category: 'Heat Sources' },
  // Pumps
  { type: 'pump_fixed', label: 'Circulator Pump', category: 'Pumps' },
  { type: 'pump_variable', label: 'Variable Pump', category: 'Pumps' },
  // Emitters
  { type: 'baseboard', label: 'Baseboard', category: 'Emitters' },
  { type: 'radiant_floor', label: 'Radiant Floor', category: 'Emitters' },
  // Valves
  { type: 'zone_valve_2way', label: 'Zone Valve (2-way)', category: 'Valves' },
  { type: 'zone_valve_3way', label: 'Zone Valve (3-way)', category: 'Valves' },
  { type: 'mixing_valve', label: 'Mixing Valve', category: 'Valves' },
  { type: 'check_valve', label: 'Check Valve', category: 'Valves' },
  { type: 'ball_valve', label: 'Ball Valve', category: 'Valves' },
  // Tanks & Separators
  { type: 'expansion_tank', label: 'Expansion Tank', category: 'Tanks' },
  { type: 'buffer_tank', label: 'Buffer Tank', category: 'Tanks' },
  { type: 'air_separator', label: 'Air Separator', category: 'Tanks' },
  { type: 'hydraulic_separator', label: 'Hydraulic Sep.', category: 'Tanks' },
  // Safety
  { type: 'pressure_relief', label: 'Relief Valve', category: 'Safety' },
  { type: 'fill_valve', label: 'Fill Valve', category: 'Safety' },
  { type: 'air_vent', label: 'Air Vent', category: 'Safety' },
  // Controls
  { type: 'thermostat', label: 'Thermostat', category: 'Controls' },
  { type: 'outdoor_reset', label: 'Outdoor Reset', category: 'Controls' },
];

function defaultPorts(_type: ComponentType): Port[] {
  // Supply port (red) + return port (blue) for most items
  return [
    { id: 'supply', type: 'supply', x: 0, y: 30 },
    { id: 'return', type: 'return', x: 60, y: 30 },
  ];
}

const grouped = PALETTE_ITEMS.reduce(
  (acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  },
  {} as Record<string, PaletteItem[]>
);

export const Palette: React.FC = () => {
  const addComponent = useStore((s) => s.addComponent);

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('application/hydronics-component', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (item: PaletteItem) => {
    addComponent({
      type: item.type,
      name: item.label,
      position: { x: 100, y: 100 },
      rotation: 0,
      flippedH: false,
      flippedV: false,
      ports: defaultPorts(item.type),
      props: {},
    } as never);
  };

  return (
    <div className={styles.palette}>
      <h3>Components</h3>
      {Object.entries(grouped).map(([cat, items]) => (
        <details key={cat} open>
          <summary>{cat}</summary>
          <ul>
            {items.map((it) => (
              <li
                key={it.type}
                draggable
                onDragStart={(e) => handleDragStart(e, it)}
                onDoubleClick={() => handleDoubleClick(it)}
              >
                {it.label}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
};
