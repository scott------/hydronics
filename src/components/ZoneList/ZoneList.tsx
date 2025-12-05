// ─────────────────────────────────────────────────────────────────────────────
// ZoneList – manage heating zones
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useStore } from '../../store';
import type { EmitterType } from '../../types';
import styles from './ZoneList.module.css';

export const ZoneList: React.FC = () => {
  const zones = useStore((s) => s.zones);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const removeZone = useStore((s) => s.removeZone);

  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    addZone({
      name: newName.trim(),
      sqFt: 200,
      heatLossOverride: null,
      designWaterTemp: 140,
      emitterType: null,
      priority: zones.length + 1,
    });
    setNewName('');
  };

  return (
    <div className={styles.container}>
      <h4>Heating Zones</h4>
      <div className={styles.addRow}>
        <input
          placeholder="Zone name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      {zones.length === 0 && <p className={styles.empty}>No zones defined.</p>}
      <ul className={styles.list}>
        {zones.map((z) => (
          <li key={z.id}>
            <input
              value={z.name}
              onChange={(e) => updateZone(z.id, { name: e.target.value })}
            />
            <label>
              Sq Ft
              <input
                type="number"
                value={z.sqFt}
                onChange={(e) => updateZone(z.id, { sqFt: +e.target.value })}
              />
            </label>
            <label>
              Override BTU/hr
              <input
                type="number"
                placeholder="auto"
                value={z.heatLossOverride ?? ''}
                onChange={(e) =>
                  updateZone(z.id, { heatLossOverride: e.target.value ? +e.target.value : null })
                }
              />
            </label>
            <label>
              Design Water °F
              <input
                type="number"
                value={z.designWaterTemp}
                onChange={(e) => updateZone(z.id, { designWaterTemp: +e.target.value })}
              />
            </label>
            <label>
              Emitter
              <select
                value={z.emitterType ?? ''}
                onChange={(e) =>
                  updateZone(z.id, { emitterType: (e.target.value || null) as EmitterType | null })
                }
              >
                <option value="">—</option>
                <option value="baseboard">Baseboard</option>
                <option value="panel_radiator">Panel Radiator</option>
                <option value="cast_iron_radiator">Cast Iron</option>
                <option value="radiant_floor">Radiant Floor</option>
                <option value="fan_coil">Fan Coil</option>
                <option value="towel_warmer">Towel Warmer</option>
              </select>
            </label>
            <button className={styles.remove} onClick={() => removeZone(z.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
