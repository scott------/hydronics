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

// ─────────────────────────────────────────────────────────────────────────────
// Default values
// ─────────────────────────────────────────────────────────────────────────────

const defaultBuilding: BuildingConfig = {
  climate: {
    designOutdoorTemp: 0,
    indoorDesignTemp: 70,
    heatingDegreeDays: 5000,
    climateZone: 5,
  },
  totalSqFt: 2000,
  floors: 1,
  ceilingHeight: 8,
  foundationType: 'basement',
  constructionEra: '2000+',
  insulation: {
    walls: 13,
    ceiling: 38,
    floor: 19,
    basementWalls: 10,
  },
  windowDoor: {
    totalWindowArea: 200,
    windowUValue: 0.3,
    exteriorDoorCount: 2,
    doorUValue: 0.5,
    doorArea: 20,
  },
  infiltration: {
    ach: 0.35,
    blowerDoorCFM50: null,
  },
};

const defaultUI: UIState = {
  tool: 'select',
  selectedIds: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,
};

const defaultSimulation: SimulationState = {
  settings: {
    running: false,
    paused: false,
    timeScale: 1,
    outdoorTemp: 30,
    elapsedSeconds: 0,
  },
  componentStates: {},
};

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

  // Simulation
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  setOutdoorTemp: (temp: number) => void;
  setTimeScale: (scale: 1 | 10 | 60 | 3600) => void;
  tickSimulation: (dt: number) => void;

  // Persistence
  resetState: () => void;
  loadState: (state: Partial<SystemState>) => void;
}

export type StoreState = SystemState & Actions;

// ─────────────────────────────────────────────────────────────────────────────
// Store definition
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      building: defaultBuilding,
      zones: [],
      components: {},
      pipes: {},
      connections: [],
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
          s.zones = [];
          s.components = {};
          s.pipes = {};
          s.connections = [];
          s.simulation = defaultSimulation;
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
