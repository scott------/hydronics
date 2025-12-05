// ─────────────────────────────────────────────────────────────────────────────
// Zustand store for the Hydronic System Designer
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type {
  SystemState,
  BuildingConfig,
  Zone,
  HydronicComponent,
  Pipe,
  Connection,
  UIState,
  SimulationState,
  Position,
  Tool,
} from '../types';
import {
  demoBuildingConfig,
  demoZones,
  demoComponents,
  demoPipes,
  demoConnections,
  demoSimulationState,
} from './demoSystem';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Generate orthogonal (right-angle) path between two points
// ─────────────────────────────────────────────────────────────────────────────
function generateOrthogonalPath(from: Position, to: Position): Position[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Simple L-shaped or Z-shaped routing
  // Go horizontal first, then vertical (or vice versa depending on relative positions)
  const midX = from.x + dx / 2;
  const midY = from.y + dy / 2;

  // If points are mostly horizontal, do horizontal-vertical
  if (Math.abs(dx) >= Math.abs(dy)) {
    return [
      { x: from.x, y: from.y },
      { x: midX, y: from.y },
      { x: midX, y: to.y },
      { x: to.x, y: to.y },
    ];
  } else {
    // Mostly vertical, do vertical-horizontal
    return [
      { x: from.x, y: from.y },
      { x: from.x, y: midY },
      { x: to.x, y: midY },
      { x: to.x, y: to.y },
    ];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default values
// ─────────────────────────────────────────────────────────────────────────────

const defaultBuilding: BuildingConfig = demoBuildingConfig;

const defaultUI: UIState = {
  tool: 'select',
  selectedIds: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,
  pendingConnection: null,
};

const defaultSimulation: SimulationState = demoSimulationState;

// ─────────────────────────────────────────────────────────────────────────────
// Actions interface
// ─────────────────────────────────────────────────────────────────────────────

interface Actions {
  // Building
  setBuilding: (building: Partial<BuildingConfig>) => void;

  // Zones
  addZone: (zone: Omit<Zone, 'id'>) => string;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  removeZone: (id: string) => void;

  // Components
  addComponent: (component: Omit<HydronicComponent, 'id' | 'zIndex'>) => string;
  updateComponent: (id: string, updates: Partial<HydronicComponent>) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, position: Position) => void;
  rotateComponent: (id: string, degrees: number) => void;
  flipComponent: (id: string, axis: 'h' | 'v') => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Pipes
  addPipe: (pipe: Omit<Pipe, 'id'>) => string;
  updatePipe: (id: string, updates: Partial<Pipe>) => void;
  removePipe: (id: string) => void;

  // Connections
  addConnection: (conn: Omit<Connection, 'id'>) => string;
  removeConnection: (id: string) => void;

  // UI
  setTool: (tool: Tool) => void;
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (offset: Position) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  // Pipe connection
  startPipeConnection: (componentId: string, portId: string, position: Position) => void;
  updatePipeConnectionMouse: (position: Position) => void;
  completePipeConnection: (toComponentId: string, toPortId: string, toPosition: Position) => void;
  cancelPipeConnection: () => void;

  // Simulation
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  setOutdoorTemp: (temp: number) => void;
  setTimeScale: (scale: 1 | 10 | 60 | 3600) => void;
  tickSimulation: (dt: number) => void;

  // Persistence
  resetState: () => void;
  clearState: () => void; // For testing - clears to empty state
  loadState: (state: Partial<SystemState>) => void;
}

export type StoreState = SystemState & Actions;

// ─────────────────────────────────────────────────────────────────────────────
// Store definition
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      // Initial state - use demo system for first-time users
      building: defaultBuilding,
      zones: demoZones,
      components: demoComponents,
      pipes: demoPipes,
      connections: demoConnections,
      simulation: defaultSimulation,
      ui: defaultUI,

      // ─── Building ──────────────────────────────────────────────────────────
      setBuilding: (updates) =>
        set((s) => {
          Object.assign(s.building, updates);
        }),

      // ─── Zones ─────────────────────────────────────────────────────────────
      addZone: (zone) => {
        const id = uuid();
        set((s) => {
          s.zones.push({ ...zone, id });
        });
        return id;
      },
      updateZone: (id, updates) =>
        set((s) => {
          const idx = s.zones.findIndex((z) => z.id === id);
          if (idx !== -1) Object.assign(s.zones[idx], updates);
        }),
      removeZone: (id) =>
        set((s) => {
          s.zones = s.zones.filter((z) => z.id !== id);
        }),

      // ─── Components ────────────────────────────────────────────────────────
      addComponent: (component) => {
        const id = uuid();
        const maxZ = Math.max(0, ...Object.values(get().components).map((c) => c.zIndex));
        set((s) => {
          s.components[id] = { ...component, id, zIndex: maxZ + 1 } as HydronicComponent;
        });
        return id;
      },
      updateComponent: (id, updates) =>
        set((s) => {
          if (s.components[id]) Object.assign(s.components[id], updates);
        }),
      removeComponent: (id) =>
        set((s) => {
          delete s.components[id];
          // Remove related connections
          s.connections = s.connections.filter(
            (c) => c.fromComponentId !== id && c.toComponentId !== id
          );
        }),
      moveComponent: (id, position) =>
        set((s) => {
          if (s.components[id]) {
            const snap = s.ui.snapToGrid ? s.ui.gridSize : 1;
            s.components[id].position = {
              x: Math.round(position.x / snap) * snap,
              y: Math.round(position.y / snap) * snap,
            };
          }
        }),
      rotateComponent: (id, degrees) =>
        set((s) => {
          if (s.components[id]) {
            s.components[id].rotation = (s.components[id].rotation + degrees) % 360;
          }
        }),
      flipComponent: (id, axis) =>
        set((s) => {
          if (s.components[id]) {
            if (axis === 'h') s.components[id].flippedH = !s.components[id].flippedH;
            else s.components[id].flippedV = !s.components[id].flippedV;
          }
        }),
      bringToFront: (id) =>
        set((s) => {
          const maxZ = Math.max(...Object.values(s.components).map((c) => c.zIndex));
          if (s.components[id]) s.components[id].zIndex = maxZ + 1;
        }),
      sendToBack: (id) =>
        set((s) => {
          const minZ = Math.min(...Object.values(s.components).map((c) => c.zIndex));
          if (s.components[id]) s.components[id].zIndex = minZ - 1;
        }),

      // ─── Pipes ─────────────────────────────────────────────────────────────
      addPipe: (pipe) => {
        const id = uuid();
        set((s) => {
          s.pipes[id] = { ...pipe, id };
        });
        return id;
      },
      updatePipe: (id, updates) =>
        set((s) => {
          if (s.pipes[id]) Object.assign(s.pipes[id], updates);
        }),
      removePipe: (id) =>
        set((s) => {
          delete s.pipes[id];
          s.connections = s.connections.filter((c) => c.pipeId !== id);
        }),

      // ─── Connections ───────────────────────────────────────────────────────
      addConnection: (conn) => {
        const id = uuid();
        set((s) => {
          s.connections.push({ ...conn, id });
        });
        return id;
      },
      removeConnection: (id) =>
        set((s) => {
          s.connections = s.connections.filter((c) => c.id !== id);
        }),

      // ─── UI ────────────────────────────────────────────────────────────────
      setTool: (tool) =>
        set((s) => {
          s.ui.tool = tool;
        }),
      setSelection: (ids) =>
        set((s) => {
          s.ui.selectedIds = ids;
        }),
      addToSelection: (id) =>
        set((s) => {
          if (!s.ui.selectedIds.includes(id)) s.ui.selectedIds.push(id);
        }),
      removeFromSelection: (id) =>
        set((s) => {
          s.ui.selectedIds = s.ui.selectedIds.filter((i) => i !== id);
        }),
      clearSelection: () =>
        set((s) => {
          s.ui.selectedIds = [];
        }),
      setZoom: (zoom) =>
        set((s) => {
          s.ui.zoom = Math.max(0.25, Math.min(4, zoom));
        }),
      setPan: (offset) =>
        set((s) => {
          s.ui.panOffset = offset;
        }),
      setGridSize: (size) =>
        set((s) => {
          s.ui.gridSize = size;
        }),
      toggleGrid: () =>
        set((s) => {
          s.ui.showGrid = !s.ui.showGrid;
        }),
      toggleSnap: () =>
        set((s) => {
          s.ui.snapToGrid = !s.ui.snapToGrid;
        }),

      // ─── Pipe Connection ───────────────────────────────────────────────────
      startPipeConnection: (componentId, portId, position) =>
        set((s) => {
          s.ui.pendingConnection = {
            fromComponentId: componentId,
            fromPortId: portId,
            fromPosition: position,
            currentMousePosition: position,
          };
        }),
      updatePipeConnectionMouse: (position) =>
        set((s) => {
          if (s.ui.pendingConnection) {
            s.ui.pendingConnection.currentMousePosition = position;
          }
        }),
      completePipeConnection: (toComponentId, toPortId, toPosition) => {
        const state = get();
        const pending = state.ui.pendingConnection;
        if (!pending) return;

        // Don't connect to the same component/port
        if (
          pending.fromComponentId === toComponentId &&
          pending.fromPortId === toPortId
        ) {
          set((s) => {
            s.ui.pendingConnection = null;
          });
          return;
        }

        // Determine pipe type based on port types
        const fromComp = state.components[pending.fromComponentId];
        const fromPort = fromComp?.ports?.find((p) => p.id === pending.fromPortId);
        const pipeType = fromPort?.type === 'supply' ? 'supply' : 'return';

        // Generate orthogonal waypoints
        const waypoints = generateOrthogonalPath(pending.fromPosition, toPosition);

        // Create the pipe
        const pipeId = uuid();
        set((s) => {
          s.pipes[pipeId] = {
            id: pipeId,
            material: 'copper',
            size: '3/4',
            lengthFt: 0, // Calculated later
            pipeType,
            insulation: 'none',
            fittings: {
              elbows90: waypoints.length - 2, // Each turn is a 90° elbow
              elbows45: 0,
              teesThrough: 0,
              teesBranch: 0,
              couplings: 0,
            },
            waypoints,
            startPortId: `${pending.fromComponentId}.${pending.fromPortId}`,
            endPortId: `${toComponentId}.${toPortId}`,
          };

          // Create connection record
          s.connections.push({
            id: uuid(),
            pipeId,
            fromComponentId: pending.fromComponentId,
            fromPortId: pending.fromPortId,
            toComponentId,
            toPortId,
          });

          // Clear pending connection
          s.ui.pendingConnection = null;
        });
      },
      cancelPipeConnection: () =>
        set((s) => {
          s.ui.pendingConnection = null;
        }),

      // ─── Simulation ────────────────────────────────────────────────────────
      startSimulation: () =>
        set((s) => {
          s.simulation.settings.running = true;
          s.simulation.settings.paused = false;
        }),
      pauseSimulation: () =>
        set((s) => {
          s.simulation.settings.paused = true;
        }),
      stopSimulation: () =>
        set((s) => {
          s.simulation.settings.running = false;
          s.simulation.settings.paused = false;
          s.simulation.settings.elapsedSeconds = 0;
          s.simulation.componentStates = {};
        }),
      setOutdoorTemp: (temp) =>
        set((s) => {
          s.simulation.settings.outdoorTemp = temp;
        }),
      setTimeScale: (scale) =>
        set((s) => {
          s.simulation.settings.timeScale = scale;
        }),
      tickSimulation: (dt) =>
        set((s) => {
          if (s.simulation.settings.running && !s.simulation.settings.paused) {
            s.simulation.settings.elapsedSeconds += dt * s.simulation.settings.timeScale;
            // TODO: Implement thermal calculations per tick
          }
        }),

      // ─── Persistence ───────────────────────────────────────────────────────
      resetState: () =>
        set((s) => {
          s.building = defaultBuilding;
          s.zones = demoZones;
          s.components = demoComponents;
          s.pipes = demoPipes;
          s.connections = demoConnections;
          s.simulation = defaultSimulation;
          s.ui = defaultUI;
        }),
      clearState: () =>
        set((s) => {
          s.building = demoBuildingConfig;
          s.zones = [];
          s.components = {};
          s.pipes = {};
          s.connections = [];
          s.simulation = {
            settings: {
              running: false,
              paused: false,
              timeScale: 1,
              outdoorTemp: 30,
              elapsedSeconds: 0,
            },
            componentStates: {},
          };
          s.ui = defaultUI;
        }),
      loadState: (state) =>
        set((s) => {
          if (state.building) Object.assign(s.building, state.building);
          if (state.zones) s.zones = state.zones;
          if (state.components) s.components = state.components;
          if (state.pipes) s.pipes = state.pipes;
          if (state.connections) s.connections = state.connections;
          if (state.simulation) Object.assign(s.simulation, state.simulation);
          if (state.ui) Object.assign(s.ui, state.ui);
        }),
    })),
    {
      name: 'hydronics-storage',
      partialize: (state) => ({
        building: state.building,
        zones: state.zones,
        components: state.components,
        pipes: state.pipes,
        connections: state.connections,
      }),
    }
  )
);
