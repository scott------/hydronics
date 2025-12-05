// ─────────────────────────────────────────────────────────────────────────────
// ValidationPanel – show warnings/errors for the design
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import { useStore } from '../../store';
// import { calculateHeatLoss } from '../../calc'; // TODO: use for boiler sizing validation
import type { ValidationMessage, ValidationSeverity } from '../../types';
import styles from './ValidationPanel.module.css';

export const ValidationPanel: React.FC = () => {
  const building = useStore((s) => s.building);
  const components = useStore((s) => s.components);
  const pipes = useStore((s) => s.pipes);
  const connections = useStore((s) => s.connections);

  const messages = useMemo<ValidationMessage[]>(() => {
    const msgs: ValidationMessage[] = [];
    const compList = Object.values(components);

    // Check for heat source
    const hasBoiler = compList.some((c) =>
      ['boiler_gas', 'boiler_oil', 'boiler_electric', 'heat_pump_a2w'].includes(c.type)
    );
    if (!hasBoiler) {
      msgs.push({ id: 'no-boiler', severity: 'error', message: 'No heat source (boiler/heat pump) in design' });
    }

    // Check for pump
    const hasPump = compList.some((c) =>
      ['pump_fixed', 'pump_variable', 'zone_pump'].includes(c.type)
    );
    if (!hasPump) {
      msgs.push({ id: 'no-pump', severity: 'error', message: 'No circulator pump in design' });
    }

    // Check for expansion tank
    const hasExpTank = compList.some((c) => c.type === 'expansion_tank');
    if (!hasExpTank) {
      msgs.push({ id: 'no-exp-tank', severity: 'warning', message: 'Missing expansion tank' });
    }

    // Check for air separator
    const hasAirSep = compList.some((c) => c.type === 'air_separator');
    if (!hasAirSep) {
      msgs.push({ id: 'no-air-sep', severity: 'warning', message: 'Missing air separator' });
    }

    // Check for pressure relief
    const hasRelief = compList.some((c) => c.type === 'pressure_relief');
    if (!hasRelief) {
      msgs.push({ id: 'no-relief', severity: 'warning', message: 'Missing pressure relief valve' });
    }

    // Boiler sizing check (simplified)
    if (hasBoiler) {
      // TODO: compare boiler capacity vs heat loss
      // For MVP, just inform if no piping yet
      if (Object.keys(pipes).length === 0) {
        msgs.push({ id: 'no-pipes', severity: 'info', message: 'No piping connections yet' });
      }
    }

    // Unconnected components
    const connectedCompIds = new Set<string>();
    connections.forEach((c) => {
      connectedCompIds.add(c.fromComponentId);
      connectedCompIds.add(c.toComponentId);
    });
    compList.forEach((comp) => {
      if (!connectedCompIds.has(comp.id) && Object.keys(pipes).length > 0) {
        msgs.push({
          id: `unconnected-${comp.id}`,
          severity: 'warning',
          message: `${comp.name} is not connected`,
          componentId: comp.id,
        });
      }
    });

    return msgs;
  }, [building, components, pipes, connections]);

  const byType = (sev: ValidationSeverity) => messages.filter((m) => m.severity === sev);
  const errors = byType('error');
  const warnings = byType('warning');
  const infos = byType('info');

  if (messages.length === 0) {
    return (
      <div className={styles.panel}>
        <span className={styles.ok}>✓ No issues</span>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {errors.length > 0 && (
        <ul className={styles.errors}>
          {errors.map((m) => (
            <li key={m.id}>❌ {m.message}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className={styles.warnings}>
          {warnings.map((m) => (
            <li key={m.id}>⚠️ {m.message}</li>
          ))}
        </ul>
      )}
      {infos.length > 0 && (
        <ul className={styles.infos}>
          {infos.map((m) => (
            <li key={m.id}>ℹ️ {m.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
