// ─────────────────────────────────────────────────────────────────────────────
// Canvas – SVG workspace with pan/zoom, grid, component rendering, piping
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store';
import { ComponentSVG } from '../ComponentSVG';
import { PipeSVG } from '../PipeSVG';
import styles from './Canvas.module.css';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;

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

  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const setSelection = useStore((s) => s.setSelection);
  const clearSelection = useStore((s) => s.clearSelection);
  const moveComponent = useStore((s) => s.moveComponent);

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
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
      if (dragId) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        moveComponent(dragId, { x: x - dragStart.x, y: y - dragStart.y });
      }
    },
    [isPanning, panStart, setPan, dragId, dragStart, panOffset, zoom, moveComponent]
  );

  const endPan = useCallback(() => {
    setIsPanning(false);
    setDragId(null);
  }, []);

  // Click on canvas background clears selection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).tagName === 'svg' || (e.target as Element).classList.contains(styles.grid)) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
  }, [selectedIds, clearSelection]);

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
        {showGrid && (
          <rect className={styles.grid} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid)" />
        )}

        {/* Pipes layer */}
        <g className="pipes">
          {Object.values(pipes).map((pipe) => (
            <PipeSVG key={pipe.id} pipe={pipe} selected={selectedIds.includes(pipe.id)} />
          ))}
        </g>

        {/* Components layer */}
        <g className="components">
          {Object.values(components)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((comp) => (
              <ComponentSVG
                key={comp.id}
                component={comp}
                selected={selectedIds.includes(comp.id)}
                onMouseDown={(e) => handleComponentMouseDown(comp.id, e)}
              />
            ))}
        </g>
      </svg>
    </div>
  );
};
