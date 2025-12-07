// ─────────────────────────────────────────────────────────────────────────────
// Store Tests - Zustand state management
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import type { HydronicComponent, Position } from '../types';

// Helper to create a minimal valid component
function createTestComponent(overrides: Partial<HydronicComponent> = {}): Omit<HydronicComponent, 'id' | 'zIndex'> {
  return {
    type: 'boiler_gas',
    name: 'Test Boiler',
    position: { x: 100, y: 100 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 15, y: 0 },
      { id: 'return', type: 'return', x: 65, y: 0 },
    ],
    props: {},
    ...overrides,
  } as Omit<HydronicComponent, 'id' | 'zIndex'>;
}

describe('Store - Component Actions', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('addComponent', () => {
    it('creates component with unique ID', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(useStore.getState().components[id]).toBeDefined();
    });

    it('assigns zIndex to new components', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent());
      
      expect(useStore.getState().components[id1].zIndex).toBe(1);
      expect(useStore.getState().components[id2].zIndex).toBe(2);
    });

    it('stores component properties correctly', () => {
      const id = useStore.getState().addComponent(createTestComponent({
        name: 'My Boiler',
        position: { x: 200, y: 300 },
      }));
      
      const comp = useStore.getState().components[id];
      expect(comp.name).toBe('My Boiler');
      expect(comp.position).toEqual({ x: 200, y: 300 });
    });
  });

  describe('removeComponent', () => {
    it('deletes component from store', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      expect(useStore.getState().components[id]).toBeDefined();
      
      useStore.getState().removeComponent(id);
      expect(useStore.getState().components[id]).toBeUndefined();
    });

    it('removes related connections', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent({ position: { x: 300, y: 100 } }));
      
      // Create a connection manually
      useStore.getState().addConnection({
        pipeId: 'pipe1',
        fromComponentId: id1,
        fromPortId: 'supply',
        toComponentId: id2,
        toPortId: 'return',
      });
      
      expect(useStore.getState().connections.length).toBe(1);
      
      useStore.getState().removeComponent(id1);
      expect(useStore.getState().connections.length).toBe(0);
    });
  });

  describe('moveComponent', () => {
    it('updates component position', () => {
      // Disable snap to get exact position
      useStore.setState({ ui: { ...useStore.getState().ui, snapToGrid: false } });
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().moveComponent(id, { x: 250, y: 350 });
      
      const comp = useStore.getState().components[id];
      expect(comp.position.x).toBe(250);
      expect(comp.position.y).toBe(350);
    });

    it('snaps to grid when enabled', () => {
      useStore.setState({ ui: { ...useStore.getState().ui, snapToGrid: true, gridSize: 20 } });
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().moveComponent(id, { x: 123, y: 147 });
      
      const comp = useStore.getState().components[id];
      expect(comp.position.x).toBe(120); // Snapped to 20
      expect(comp.position.y).toBe(140); // Snapped to 20
    });

    it('does not snap when disabled', () => {
      useStore.setState({ ui: { ...useStore.getState().ui, snapToGrid: false } });
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().moveComponent(id, { x: 123, y: 147 });
      
      const comp = useStore.getState().components[id];
      expect(comp.position.x).toBe(123);
      expect(comp.position.y).toBe(147);
    });
  });

  describe('rotateComponent', () => {
    it('adds rotation degrees', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().rotateComponent(id, 90);
      
      expect(useStore.getState().components[id].rotation).toBe(90);
    });

    it('wraps at 360 degrees', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().rotateComponent(id, 270);
      useStore.getState().rotateComponent(id, 180);
      
      expect(useStore.getState().components[id].rotation).toBe(90); // 450 % 360 = 90
    });
  });

  describe('flipComponent', () => {
    it('toggles horizontal flip', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      expect(useStore.getState().components[id].flippedH).toBe(false);
      
      useStore.getState().flipComponent(id, 'h');
      expect(useStore.getState().components[id].flippedH).toBe(true);
      
      useStore.getState().flipComponent(id, 'h');
      expect(useStore.getState().components[id].flippedH).toBe(false);
    });

    it('toggles vertical flip', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().flipComponent(id, 'v');
      expect(useStore.getState().components[id].flippedV).toBe(true);
    });
  });

  describe('bringToFront / sendToBack', () => {
    it('bringToFront increases zIndex', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent());
      
      useStore.getState().bringToFront(id1);
      expect(useStore.getState().components[id1].zIndex).toBeGreaterThan(
        useStore.getState().components[id2].zIndex
      );
    });

    it('sendToBack decreases zIndex', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent());
      
      useStore.getState().sendToBack(id2);
      expect(useStore.getState().components[id2].zIndex).toBeLessThan(
        useStore.getState().components[id1].zIndex
      );
    });
  });
});

describe('Store - Pipe Actions', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('addPipe', () => {
    it('creates pipe with unique ID', () => {
      const id = useStore.getState().addPipe({
        material: 'copper',
        size: '3/4',
        lengthFt: 10,
        pipeType: 'supply',
        insulation: 'none',
        fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
        waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        startPortId: null,
        endPortId: null,
      });
      
      expect(id).toBeDefined();
      expect(useStore.getState().pipes[id]).toBeDefined();
    });

    it('stores waypoints correctly', () => {
      const waypoints: Position[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
      ];
      
      const id = useStore.getState().addPipe({
        material: 'copper',
        size: '3/4',
        lengthFt: 10,
        pipeType: 'supply',
        insulation: 'none',
        fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
        waypoints,
        startPortId: null,
        endPortId: null,
      });
      
      expect(useStore.getState().pipes[id].waypoints).toEqual(waypoints);
    });
  });

  describe('removePipe', () => {
    it('deletes pipe from store', () => {
      const id = useStore.getState().addPipe({
        material: 'copper',
        size: '3/4',
        lengthFt: 10,
        pipeType: 'supply',
        insulation: 'none',
        fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
        waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        startPortId: null,
        endPortId: null,
      });
      
      useStore.getState().removePipe(id);
      expect(useStore.getState().pipes[id]).toBeUndefined();
    });

    it('removes related connections', () => {
      const pipeId = useStore.getState().addPipe({
        material: 'copper',
        size: '3/4',
        lengthFt: 10,
        pipeType: 'supply',
        insulation: 'none',
        fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
        waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        startPortId: null,
        endPortId: null,
      });
      
      useStore.getState().addConnection({
        pipeId,
        fromComponentId: 'comp1',
        fromPortId: 'supply',
        toComponentId: 'comp2',
        toPortId: 'return',
      });
      
      expect(useStore.getState().connections.length).toBe(1);
      
      useStore.getState().removePipe(pipeId);
      expect(useStore.getState().connections.length).toBe(0);
    });
  });
});

describe('Store - Pipe Connection Actions', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('startPipeConnection', () => {
    it('sets pending connection state', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 50 });
      
      const pending = useStore.getState().ui.pendingConnection;
      expect(pending).not.toBeNull();
      expect(pending?.fromComponentId).toBe('comp1');
      expect(pending?.fromPortId).toBe('supply');
      expect(pending?.fromPosition).toEqual({ x: 100, y: 50 });
    });

    it('sets current mouse position to start position', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 50 });
      
      const pending = useStore.getState().ui.pendingConnection;
      expect(pending?.currentMousePosition).toEqual({ x: 100, y: 50 });
    });
  });

  describe('updatePipeConnectionMouse', () => {
    it('updates current mouse position', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 50 });
      useStore.getState().updatePipeConnectionMouse({ x: 200, y: 150 });
      
      expect(useStore.getState().ui.pendingConnection?.currentMousePosition).toEqual({ x: 200, y: 150 });
    });

    it('does nothing if no pending connection', () => {
      useStore.getState().updatePipeConnectionMouse({ x: 200, y: 150 });
      expect(useStore.getState().ui.pendingConnection).toBeNull();
    });
  });

  describe('completePipeConnection', () => {
    it('creates pipe and connection', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent({ position: { x: 300, y: 100 } }));
      
      useStore.getState().startPipeConnection(id1, 'supply', { x: 115, y: 100 });
      useStore.getState().completePipeConnection(id2, 'return', { x: 365, y: 100 });
      
      const pipes = Object.values(useStore.getState().pipes);
      const connections = useStore.getState().connections;
      
      expect(pipes.length).toBe(1);
      expect(connections.length).toBe(1);
    });

    it('clears pending connection', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent({ position: { x: 300, y: 100 } }));
      
      useStore.getState().startPipeConnection(id1, 'supply', { x: 115, y: 100 });
      useStore.getState().completePipeConnection(id2, 'return', { x: 365, y: 100 });
      
      expect(useStore.getState().ui.pendingConnection).toBeNull();
    });

    it('prevents self-connection (same port)', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      
      useStore.getState().startPipeConnection(id, 'supply', { x: 115, y: 100 });
      useStore.getState().completePipeConnection(id, 'supply', { x: 115, y: 100 });
      
      expect(Object.keys(useStore.getState().pipes).length).toBe(0);
      expect(useStore.getState().connections.length).toBe(0);
    });

    it('generates orthogonal waypoints', () => {
      const id1 = useStore.getState().addComponent(createTestComponent());
      const id2 = useStore.getState().addComponent(createTestComponent({ position: { x: 300, y: 200 } }));
      
      useStore.getState().startPipeConnection(id1, 'supply', { x: 100, y: 100 });
      useStore.getState().completePipeConnection(id2, 'return', { x: 300, y: 200 });
      
      const pipe = Object.values(useStore.getState().pipes)[0];
      expect(pipe.waypoints.length).toBeGreaterThanOrEqual(2);
      // First and last points should match
      expect(pipe.waypoints[0]).toEqual({ x: 100, y: 100 });
      expect(pipe.waypoints[pipe.waypoints.length - 1]).toEqual({ x: 300, y: 200 });
    });
  });

  describe('cancelPipeConnection', () => {
    it('clears pending connection', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 50 });
      expect(useStore.getState().ui.pendingConnection).not.toBeNull();
      
      useStore.getState().cancelPipeConnection();
      expect(useStore.getState().ui.pendingConnection).toBeNull();
    });
  });
});

describe('Store - Zone Actions', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('addZone', () => {
    it('creates zone with unique ID', () => {
      const id = useStore.getState().addZone({
        name: 'Living Room',
        sqFt: 500,
        heatLossOverride: null,
        designWaterTemp: 140,
        emitterType: 'baseboard',
        priority: 1,
      });
      
      expect(id).toBeDefined();
      expect(useStore.getState().zones.find(z => z.id === id)).toBeDefined();
    });
  });

  describe('updateZone', () => {
    it('modifies zone properties', () => {
      const id = useStore.getState().addZone({
        name: 'Living Room',
        sqFt: 500,
        heatLossOverride: null,
        designWaterTemp: 140,
        emitterType: 'baseboard',
        priority: 1,
      });
      
      useStore.getState().updateZone(id, { name: 'Family Room', sqFt: 600 });
      
      const zone = useStore.getState().zones.find(z => z.id === id);
      expect(zone?.name).toBe('Family Room');
      expect(zone?.sqFt).toBe(600);
    });
  });

  describe('removeZone', () => {
    it('deletes zone from store', () => {
      const id = useStore.getState().addZone({
        name: 'Test Zone',
        sqFt: 500,
        heatLossOverride: null,
        designWaterTemp: 140,
        emitterType: null,
        priority: 1,
      });
      
      expect(useStore.getState().zones.length).toBe(1);
      
      useStore.getState().removeZone(id);
      expect(useStore.getState().zones.length).toBe(0);
    });
  });
});

describe('Store - UI Actions', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('setTool', () => {
    it('changes current tool', () => {
      useStore.getState().setTool('pan');
      expect(useStore.getState().ui.tool).toBe('pan');
      
      useStore.getState().setTool('pipe');
      expect(useStore.getState().ui.tool).toBe('pipe');
    });
  });

  describe('selection actions', () => {
    it('setSelection replaces selection', () => {
      useStore.getState().setSelection(['a', 'b']);
      expect(useStore.getState().ui.selectedIds).toEqual(['a', 'b']);
      
      useStore.getState().setSelection(['c']);
      expect(useStore.getState().ui.selectedIds).toEqual(['c']);
    });

    it('addToSelection adds without duplicates', () => {
      useStore.getState().setSelection(['a']);
      useStore.getState().addToSelection('b');
      expect(useStore.getState().ui.selectedIds).toContain('a');
      expect(useStore.getState().ui.selectedIds).toContain('b');
      
      useStore.getState().addToSelection('a');
      expect(useStore.getState().ui.selectedIds.filter(id => id === 'a').length).toBe(1);
    });

    it('removeFromSelection removes ID', () => {
      useStore.getState().setSelection(['a', 'b', 'c']);
      useStore.getState().removeFromSelection('b');
      expect(useStore.getState().ui.selectedIds).toEqual(['a', 'c']);
    });

    it('clearSelection empties selection', () => {
      useStore.getState().setSelection(['a', 'b']);
      useStore.getState().clearSelection();
      expect(useStore.getState().ui.selectedIds).toEqual([]);
    });
  });

  describe('setZoom', () => {
    it('sets zoom level', () => {
      useStore.getState().setZoom(1.5);
      expect(useStore.getState().ui.zoom).toBe(1.5);
    });

    it('clamps minimum zoom', () => {
      useStore.getState().setZoom(0.1);
      expect(useStore.getState().ui.zoom).toBe(0.25);
    });

    it('clamps maximum zoom', () => {
      useStore.getState().setZoom(10);
      expect(useStore.getState().ui.zoom).toBe(4);
    });
  });

  describe('setPan', () => {
    it('sets pan offset', () => {
      useStore.getState().setPan({ x: 100, y: -50 });
      expect(useStore.getState().ui.panOffset).toEqual({ x: 100, y: -50 });
    });
  });

  describe('toggleGrid / toggleSnap', () => {
    it('toggleGrid flips showGrid', () => {
      const initial = useStore.getState().ui.showGrid;
      useStore.getState().toggleGrid();
      expect(useStore.getState().ui.showGrid).toBe(!initial);
    });

    it('toggleSnap flips snapToGrid', () => {
      const initial = useStore.getState().ui.snapToGrid;
      useStore.getState().toggleSnap();
      expect(useStore.getState().ui.snapToGrid).toBe(!initial);
    });
  });
});

describe('Store - Persistence', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('resetState', () => {
    it('clears all data', () => {
      useStore.getState().addComponent(createTestComponent());
      useStore.getState().addZone({ name: 'Test', sqFt: 100, heatLossOverride: null, designWaterTemp: 140, emitterType: null, priority: 1 });

      useStore.getState().clearState();

      expect(Object.keys(useStore.getState().components).length).toBe(0);
      expect(useStore.getState().zones.length).toBe(0);
      expect(Object.keys(useStore.getState().pipes).length).toBe(0);
    });

    it('restores default UI state', () => {
      useStore.getState().setZoom(2);
      useStore.getState().setTool('pipe');

      useStore.getState().clearState();

      expect(useStore.getState().ui.zoom).toBe(1);
      expect(useStore.getState().ui.tool).toBe('select');
    });
  });
});

describe('Store - Undo/Redo', () => {
  beforeEach(() => {
    useStore.getState().clearState();
    // Also reset history
    useStore.setState({ _history: [], _historyIndex: -1 });
  });

  describe('pushHistory', () => {
    it('captures current state snapshot', () => {
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();

      expect(useStore.getState()._history.length).toBe(1);
      expect(useStore.getState()._history[0].components[id]).toBeDefined();
    });

    it('truncates future when pushing after undo', () => {
      // Create initial state and push
      useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();

      // Add another component and push
      useStore.getState().addComponent(createTestComponent({ name: 'Second' }));
      useStore.getState().pushHistory();

      // Undo to go back
      useStore.getState().undo();

      // Now push new state - should truncate the future
      useStore.getState().addComponent(createTestComponent({ name: 'Third' }));
      useStore.getState().pushHistory();

      // History should be truncated
      expect(useStore.getState()._history.length).toBeLessThanOrEqual(3);
    });

    it('limits history size to MAX_HISTORY_SIZE', () => {
      // Push more than 50 history entries
      for (let i = 0; i < 55; i++) {
        useStore.getState().addComponent(createTestComponent({ name: `Comp ${i}` }));
        useStore.getState().pushHistory();
      }

      expect(useStore.getState()._history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('undo', () => {
    it('restores previous state', () => {
      // Add a component and save state
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();

      // Remove the component
      useStore.getState().removeComponent(id);
      expect(useStore.getState().components[id]).toBeUndefined();

      // Undo - component should be restored
      useStore.getState().undo();
      expect(useStore.getState().components[id]).toBeDefined();
    });

    it('canUndo returns false when no history', () => {
      expect(useStore.getState().canUndo()).toBe(false);
    });

    it('canUndo returns true when history exists', () => {
      useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();

      expect(useStore.getState().canUndo()).toBe(true);
    });

    it('multiple undos walk back through history', () => {
      // State 1: Add first component
      const id1 = useStore.getState().addComponent(createTestComponent({ name: 'First' }));
      useStore.getState().pushHistory();

      // State 2: Add second component
      useStore.getState().addComponent(createTestComponent({ name: 'Second' }));
      useStore.getState().pushHistory();

      // State 3: Add third component
      useStore.getState().addComponent(createTestComponent({ name: 'Third' }));

      // Undo back to state 2
      useStore.getState().undo();
      expect(Object.keys(useStore.getState().components).length).toBe(2);

      // Undo back to state 1
      useStore.getState().undo();
      expect(Object.keys(useStore.getState().components).length).toBe(1);
      expect(useStore.getState().components[id1]).toBeDefined();
    });
  });

  describe('redo', () => {
    it('restores undone state', () => {
      // Add component and save
      const id = useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();

      // Make a change
      useStore.getState().removeComponent(id);

      // Undo
      useStore.getState().undo();
      expect(useStore.getState().components[id]).toBeDefined();

      // Redo - component should be removed again
      useStore.getState().redo();
      expect(useStore.getState().components[id]).toBeUndefined();
    });

    it('canRedo returns false when at end of history', () => {
      useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();

      expect(useStore.getState().canRedo()).toBe(false);
    });

    it('canRedo returns true after undo', () => {
      useStore.getState().addComponent(createTestComponent());
      useStore.getState().pushHistory();
      useStore.getState().undo();

      expect(useStore.getState().canRedo()).toBe(true);
    });
  });

  describe('removeComponent pushes history', () => {
    it('allows undo of component removal', () => {
      const id = useStore.getState().addComponent(createTestComponent());

      // Remove (this should push history automatically)
      useStore.getState().removeComponent(id);
      expect(useStore.getState().components[id]).toBeUndefined();

      // Undo should restore
      useStore.getState().undo();
      expect(useStore.getState().components[id]).toBeDefined();
    });
  });

  describe('removePipe pushes history', () => {
    it('allows undo of pipe removal', () => {
      const pipeId = useStore.getState().addPipe({
        material: 'copper',
        size: '3/4',
        lengthFt: 10,
        pipeType: 'supply',
        insulation: 'none',
        fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
        waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        startPortId: null,
        endPortId: null,
      });

      // Remove (this should push history automatically)
      useStore.getState().removePipe(pipeId);
      expect(useStore.getState().pipes[pipeId]).toBeUndefined();

      // Undo should restore
      useStore.getState().undo();
      expect(useStore.getState().pipes[pipeId]).toBeDefined();
    });
  });
});
