// ─────────────────────────────────────────────────────────────────────────────
// Canvas – SVG workspace with pan/zoom, grid, component rendering, piping
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store';
import { ComponentSVG } from '../ComponentSVG';
import { PipeSVG } from '../PipeSVG';
import { ZoneBounds } from '../ZoneBounds';
import styles from './Canvas.module.css';

// Animation keyframe styles injected into SVG
const AnimationStyles = () => (
  <style>
    {`
      @keyframes flowForward {
        from { stroke-dashoffset: 24; }
        to { stroke-dashoffset: 0; }
      }
      @keyframes flowReverse {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: 24; }
      }
      @keyframes pumpRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes flameFlicker {
        0%, 100% { opacity: 1; transform: scaleY(1); }
        25% { opacity: 0.8; transform: scaleY(1.1); }
        50% { opacity: 1; transform: scaleY(0.9); }
        75% { opacity: 0.9; transform: scaleY(1.05); }
      }
      @keyframes heatWave {
        0%, 100% { opacity: 0.3; transform: translateY(0); }
        50% { opacity: 0.6; transform: translateY(-3px); }
      }
      @keyframes valvePulse {
        0%, 100% { fill-opacity: 0.8; }
        50% { fill-opacity: 1; }
      }
      .flow-forward {
        stroke-dasharray: 12 12;
        animation: flowForward 0.5s linear infinite;
      }
      .flow-reverse {
        stroke-dasharray: 12 12;
        animation: flowReverse 0.5s linear infinite;
      }
      .pump-impeller-spinning {
        transform-origin: 30px 30px;
        animation: pumpRotate 0.5s linear infinite;
      }
      .flame-active {
        transform-origin: 40px 35px;
        animation: flameFlicker 0.3s ease-in-out infinite;
      }
      .heat-wave {
        animation: heatWave 1s ease-in-out infinite;
      }
      .valve-open {
        animation: valvePulse 1s ease-in-out infinite;
      }
    `}
  </style>
);

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;

/** Generate orthogonal preview path for pending connection */
function generatePreviewPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const midX = from.x + dx / 2;
  const midY = from.y + dy / 2;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  } else {
    return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
  }
}

export const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = useStore((s) => s.ui.zoom);
  const panOffset = useStore((s) => s.ui.panOffset);
  const gridSize = useStore((s) => s.ui.gridSize);
  const showGrid = useStore((s) => s.ui.showGrid);
  const tool = useStore((s) => s.ui.tool);
  const selectedIds = useStore((s) => s.ui.selectedIds);
  const components = useStore((s) => s.components);
  const pipes = useStore((s) => s.pipes);
  const simulationRunning = useStore((s) => s.simulation.settings.running);
  const simulationPaused = useStore((s) => s.simulation.settings.paused);
  const componentStates = useStore((s) => s.simulation.componentStates);
  const showZoneBounds = useStore((s) => s.ui.showZoneBounds);
  const zoneBounds = useStore((s) => s.ui.zoneBounds);
  
  // Simulation is active when running and not paused
  const simActive = simulationRunning && !simulationPaused;

  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const setSelection = useStore((s) => s.setSelection);
  const clearSelection = useStore((s) => s.clearSelection);
  const moveComponent = useStore((s) => s.moveComponent);
  const pendingConnection = useStore((s) => s.ui.pendingConnection);
  const updatePipeConnectionMouse = useStore((s) => s.updatePipeConnectionMouse);
  const cancelPipeConnection = useStore((s) => s.cancelPipeConnection);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  // Pan handlers
  const startPan = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'pan' || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [tool, panOffset]
  );

  const movePan = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Update pending connection mouse position
      if (pendingConnection) {
        const mx = (e.clientX - rect.left - panOffset.x) / zoom;
        const my = (e.clientY - rect.top - panOffset.y) / zoom;
        updatePipeConnectionMouse({ x: mx, y: my });
      }

      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
      if (dragId) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        moveComponent(dragId, { x: x - dragStart.x, y: y - dragStart.y });
      }
    },
    [isPanning, panStart, setPan, dragId, dragStart, panOffset, zoom, moveComponent, pendingConnection, updatePipeConnectionMouse]
  );

  const endPan = useCallback(() => {
    setIsPanning(false);
    setDragId(null);
  }, []);

  // Click on canvas background clears selection or cancels pending connection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).tagName === 'svg' || (e.target as Element).classList.contains(styles.grid)) {
        if (pendingConnection) {
          cancelPipeConnection();
        } else {
          clearSelection();
        }
      }
    },
    [clearSelection, pendingConnection, cancelPipeConnection]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (useStore.getState().ui.pendingConnection) {
          cancelPipeConnection();
        } else {
          clearSelection();
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedIds.forEach((id) => {
          useStore.getState().removeComponent(id);
          useStore.getState().removePipe(id);
        });
        clearSelection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, clearSelection, cancelPipeConnection]);

  // Component drag start from within canvas
  const handleComponentMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const comp = components[id];
      const mx = (e.clientX - rect.left - panOffset.x) / zoom;
      const my = (e.clientY - rect.top - panOffset.y) / zoom;
      setDragId(id);
      setDragStart({ x: mx - comp.position.x, y: my - comp.position.y });
      if (!e.shiftKey) setSelection([id]);
      else useStore.getState().addToSelection(id);
    },
    [components, panOffset, zoom, setSelection]
  );

  // Grid pattern
  const gridPattern = showGrid ? (
    <defs>
      <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
        <path
          d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
          fill="none"
          stroke="#ddd"
          strokeWidth={0.5}
        />
      </pattern>
    </defs>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseDown={startPan}
      onMouseMove={movePan}
      onMouseUp={endPan}
      onMouseLeave={endPan}
    >
      <svg
        ref={svgRef}
        className={styles.svg}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        {gridPattern}
        <AnimationStyles />
        {showGrid && (
          <rect className={styles.grid} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid)" />
        )}

        {/* Zone bounding boxes layer (behind pipes) */}
        {showZoneBounds && zoneBounds.length > 0 && (
          <ZoneBounds bounds={zoneBounds} />
        )}

        {/* Pipes layer */}
        <g className="pipes">
          {Object.values(pipes).map((pipe) => (
            <PipeSVG
              key={pipe.id}
              pipe={pipe}
              selected={selectedIds.includes(pipe.id)}
              animated={simActive}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (!e.shiftKey) setSelection([pipe.id]);
                else useStore.getState().addToSelection(pipe.id);
              }}
            />
          ))}
        </g>

        {/* Pending connection preview */}
        {pendingConnection && (
          <g className="pending-connection">
            <path
              d={generatePreviewPath(
                pendingConnection.fromPosition,
                pendingConnection.currentMousePosition
              )}
              fill="none"
              stroke="#ff9800"
              strokeWidth={3}
              strokeDasharray="8 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
              pointerEvents="none"
            />
            {/* End cursor indicator */}
            <circle
              cx={pendingConnection.currentMousePosition.x}
              cy={pendingConnection.currentMousePosition.y}
              r={6}
              fill="#ff9800"
              opacity={0.6}
              pointerEvents="none"
            />
          </g>
        )}

        {/* Components layer */}
        <g className="components">
          {Object.values(components)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((comp) => (
              <ComponentSVG
                key={comp.id}
                component={comp}
                selected={selectedIds.includes(comp.id)}
                onMouseDown={(e: React.MouseEvent) => handleComponentMouseDown(comp.id, e)}
                simActive={simActive}
                simState={componentStates[comp.id]}
              />
            ))}
        </g>
      </svg>
    </div>
  );
};
