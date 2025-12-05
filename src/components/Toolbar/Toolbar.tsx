// ─────────────────────────────────────────────────────────────────────────────
// Toolbar – file ops, tool selection, view options, simulation controls
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef } from 'react';
import { useStore } from '../../store';
import type { Tool } from '../../types';
import styles from './Toolbar.module.css';

export const Toolbar: React.FC = () => {
  const tool = useStore((s) => s.ui.tool);
  const zoom = useStore((s) => s.ui.zoom);
  const showGrid = useStore((s) => s.ui.showGrid);
  const snapToGrid = useStore((s) => s.ui.snapToGrid);
  const simRunning = useStore((s) => s.simulation.settings.running);
  const simPaused = useStore((s) => s.simulation.settings.paused);

  const setTool = useStore((s) => s.setTool);
  const setZoom = useStore((s) => s.setZoom);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const toggleSnap = useStore((s) => s.toggleSnap);
  const resetState = useStore((s) => s.resetState);
  const loadState = useStore((s) => s.loadState);
  const startSimulation = useStore((s) => s.startSimulation);
  const pauseSimulation = useStore((s) => s.pauseSimulation);
  const stopSimulation = useStore((s) => s.stopSimulation);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const state = {
      building: useStore.getState().building,
      zones: useStore.getState().zones,
      components: useStore.getState().components,
      pipes: useStore.getState().pipes,
      connections: useStore.getState().connections,
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydronic-design.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        loadState(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadDemo = () => {
    if (confirm('Load demo system? This will replace your current design.')) {
      resetState();
      startSimulation();
    }
  };

  const tools: { key: Tool; label: string }[] = [
    { key: 'select', label: '⬚ Select' },
    { key: 'pan', label: '✋ Pan' },
    { key: 'pipe', label: '〰 Pipe' },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button onClick={() => fileInputRef.current?.click()}>📂 Open</button>
        <button onClick={handleExport}>💾 Save</button>
        <button onClick={handleLoadDemo}>🏠 Demo</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          hidden
          onChange={handleImport}
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        {tools.map((t) => (
          <button
            key={t.key}
            className={tool === t.key ? styles.active : ''}
            onClick={() => setTool(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button onClick={() => setZoom(zoom - 0.1)}>➖</button>
        <span className={styles.zoom}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom + 0.1)}>➕</button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <label>
          <input type="checkbox" checked={showGrid} onChange={toggleGrid} /> Grid
        </label>
        <label>
          <input type="checkbox" checked={snapToGrid} onChange={toggleSnap} /> Snap
        </label>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        {!simRunning ? (
          <button onClick={startSimulation} className={styles.simStart}>▶ Run</button>
        ) : simPaused ? (
          <button onClick={startSimulation} className={styles.simStart}>▶ Resume</button>
        ) : (
          <button onClick={pauseSimulation} className={styles.simPause}>⏸ Pause</button>
        )}
        <button onClick={stopSimulation} disabled={!simRunning} className={styles.simStop}>⏹ Stop</button>
        <span className={styles.simStatus}>
          {simRunning ? (simPaused ? '⏸ Paused' : '🔴 Running') : '⏹ Stopped'}
        </span>
      </div>
    </div>
  );
};
