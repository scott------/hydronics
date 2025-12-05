// ─────────────────────────────────────────────────────────────────────────────
// PropertiesPanel – show/edit selected component or system summary
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useStore } from '../../store';
import { calculateHeatLoss, allocateZoneHeatLoss, requiredGPM } from '../../calc';
import styles from './PropertiesPanel.module.css';

export const PropertiesPanel: React.FC = () => {
  const selectedIds = useStore((s) => s.ui.selectedIds);
  const components = useStore((s) => s.components);
  const building = useStore((s) => s.building);
  const zones = useStore((s) => s.zones);
  const updateComponent = useStore((s) => s.updateComponent);
  const rotateComponent = useStore((s) => s.rotateComponent);
  const flipComponent = useStore((s) => s.flipComponent);
  const removeComponent = useStore((s) => s.removeComponent);

  // Show system summary when nothing selected
  if (selectedIds.length === 0) {
    const loss = calculateHeatLoss(building);
    const zoneLosses = allocateZoneHeatLoss(loss.total, building.totalSqFt, zones);
    const recommendedBoiler = Math.ceil(loss.total * 1.1); // 10% safety
    const designDeltaT = 20; // typical baseboard
    const systemGPM = requiredGPM(loss.total, designDeltaT);

    return (
      <div className={styles.panel}>
        <h4>System Summary</h4>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Total Heat Loss</td>
              <td>{loss.total.toLocaleString()} BTU/hr</td>
            </tr>
            <tr>
              <td>Walls</td>
              <td>{loss.walls.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Windows</td>
              <td>{loss.windows.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Doors</td>
              <td>{loss.doors.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Ceiling</td>
              <td>{loss.ceiling.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Floor</td>
              <td>{loss.floor.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Infiltration</td>
              <td>{loss.infiltration.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Recommended Boiler</td>
              <td>{recommendedBoiler.toLocaleString()} BTU/hr</td>
            </tr>
            <tr>
              <td>System GPM (ΔT=20)</td>
              <td>{systemGPM.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
        {zones.length > 0 && (
          <>
            <h5>Zone Loads</h5>
            <ul className={styles.zoneList}>
              {zones.map((z) => (
                <li key={z.id}>
                  {z.name}: {(zoneLosses.get(z.id) ?? 0).toLocaleString()} BTU/hr
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  // Single component selected
  if (selectedIds.length === 1) {
    const comp = components[selectedIds[0]];
    if (!comp) return <div className={styles.panel}>No component</div>;

    return (
      <div className={styles.panel}>
        <h4>{comp.type.replace(/_/g, ' ')}</h4>
        <label>
          Name
          <input
            value={comp.name}
            onChange={(e) => updateComponent(comp.id, { name: e.target.value })}
          />
        </label>
        <label>
          Position X
          <input
            type="number"
            value={comp.position.x}
            onChange={(e) =>
              updateComponent(comp.id, { position: { ...comp.position, x: +e.target.value } })
            }
          />
        </label>
        <label>
          Position Y
          <input
            type="number"
            value={comp.position.y}
            onChange={(e) =>
              updateComponent(comp.id, { position: { ...comp.position, y: +e.target.value } })
            }
          />
        </label>
        <div className={styles.actions}>
          <button onClick={() => rotateComponent(comp.id, 90)}>Rotate 90°</button>
          <button onClick={() => flipComponent(comp.id, 'h')}>Flip H</button>
          <button onClick={() => flipComponent(comp.id, 'v')}>Flip V</button>
        </div>
        <button className={styles.delete} onClick={() => removeComponent(comp.id)}>
          Delete
        </button>
      </div>
    );
  }

  // Multiple selected
  return (
    <div className={styles.panel}>
      <h4>{selectedIds.length} items selected</h4>
      <button
        className={styles.delete}
        onClick={() => selectedIds.forEach((id) => removeComponent(id))}
      >
        Delete All
      </button>
    </div>
  );
};
