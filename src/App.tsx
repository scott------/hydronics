// ─────────────────────────────────────────────────────────────────────────────
// App – main shell wiring all components together
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import {
  Toolbar,
  Palette,
  Canvas,
  PropertiesPanel,
  ValidationPanel,
  BuildingForm,
  ZoneList,
} from './components';
import { useStore } from './store';
import type { ComponentType, Port } from './types';
import './App.css';

function defaultPorts(_type: ComponentType): Port[] {
  return [
    { id: 'supply', type: 'supply', x: 0, y: 30 },
    { id: 'return', type: 'return', x: 60, y: 30 },
  ];
}

const App: React.FC = () => {
  const addComponent = useStore((s) => s.addComponent);
  const panOffset = useStore((s) => s.ui.panOffset);
  const zoom = useStore((s) => s.ui.zoom);
  const components = useStore((s) => s.components);
  const simulationRunning = useStore((s) => s.simulation.settings.running);
  const startSimulation = useStore((s) => s.startSimulation);

  const [leftTab, setLeftTab] = useState<'palette' | 'building'>('palette');

  // Auto-start simulation when demo system is loaded
  useEffect(() => {
    // If we have demo components and simulation isn't running, start it
    const hasComponents = Object.keys(components).length > 0;
    if (hasComponents && !simulationRunning) {
      startSimulation();
    }
  }, []); // Run only on mount

  // Handle drop from palette
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/hydronics-component');
      if (!data) return;
      try {
        const item = JSON.parse(data);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        addComponent({
          type: item.type,
          name: item.label,
          position: { x, y },
          rotation: 0,
          flippedH: false,
          flippedV: false,
          ports: defaultPorts(item.type),
          props: {},
        } as never);
      } catch {
        /* ignore */
      }
    },
    [addComponent, panOffset, zoom]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <aside className="left-sidebar">
          <div className="tabs">
            <button
              className={leftTab === 'palette' ? 'active' : ''}
              onClick={() => setLeftTab('palette')}
            >
              Components
            </button>
            <button
              className={leftTab === 'building' ? 'active' : ''}
              onClick={() => setLeftTab('building')}
            >
              Building
            </button>
          </div>
          {leftTab === 'palette' ? (
            <Palette />
          ) : (
            <div className="building-panel">
              <BuildingForm />
              <ZoneList />
            </div>
          )}
        </aside>
        <div className="canvas-container" onDrop={handleDrop} onDragOver={handleDragOver}>
          <Canvas />
        </div>
        <aside className="right-sidebar">
          <PropertiesPanel />
        </aside>
      </div>
      <ValidationPanel />
    </div>
  );
};

export default App
