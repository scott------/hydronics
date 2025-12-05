// ─────────────────────────────────────────────────────────────────────────────
// Auto Layout Tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import {
  autoLayoutSystem,
  calculateZoneBounds,
  buildComponentZoneMap,
  generateSmartOrthogonalPath,
  recalculatePipeWaypoints,
} from './autoLayout';
import type { HydronicComponent, Pipe, Connection, Zone, Position } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createTestComponent(
  id: string,
  type: string,
  name: string,
  x: number,
  y: number
): HydronicComponent {
  return {
    id,
    type: type as HydronicComponent['type'],
    name,
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 0, y: 30 },
      { id: 'return', type: 'return', x: 60, y: 30 },
    ],
    zIndex: 1,
    props: {},
  } as HydronicComponent;
}

function createTestPipe(
  id: string,
  startCompId: string,
  startPortId: string,
  endCompId: string,
  endPortId: string,
  pipeType: 'supply' | 'return' = 'supply'
): Pipe {
  return {
    id,
    material: 'copper',
    size: '3/4',
    lengthFt: 10,
    pipeType,
    insulation: 'none',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    startPortId: `${startCompId}.${startPortId}`,
    endPortId: `${endCompId}.${endPortId}`,
  };
}

function createTestConnection(
  id: string,
  pipeId: string,
  fromCompId: string,
  fromPortId: string,
  toCompId: string,
  toPortId: string
): Connection {
  return {
    id,
    pipeId,
    fromComponentId: fromCompId,
    fromPortId,
    toComponentId: toCompId,
    toPortId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('autoLayout', () => {
  describe('buildComponentZoneMap', () => {
    it('should assign boilers to mechanical zone', () => {
      const components: Record<string, HydronicComponent> = {
        boiler1: createTestComponent('boiler1', 'boiler_gas', 'Gas Boiler', 100, 100),
      };
      const connections: Connection[] = [];
      const zones: Zone[] = [];

      const map = buildComponentZoneMap(components, connections, zones);

      expect(map.get('boiler1')).toBe('mechanical');
    });

    it('should assign pumps to mechanical zone', () => {
      const components: Record<string, HydronicComponent> = {
        pump1: createTestComponent('pump1', 'pump_variable', 'Primary Pump', 200, 100),
      };
      const connections: Connection[] = [];
      const zones: Zone[] = [];

      const map = buildComponentZoneMap(components, connections, zones);

      expect(map.get('pump1')).toBe('mechanical');
    });

    it('should assign baseboards to zones based on name matching', () => {
      const components: Record<string, HydronicComponent> = {
        rad1: createTestComponent('rad1', 'baseboard', '2F Living Room', 500, 100),
      };
      const connections: Connection[] = [];
      const zones: Zone[] = [
        { id: 'zone-1', name: 'Floor 1 - Garage', sqFt: 800, heatLossOverride: null, designWaterTemp: 110, emitterType: 'radiant_floor', priority: 1 },
        { id: 'zone-2', name: 'Floor 2 - Living', sqFt: 1800, heatLossOverride: null, designWaterTemp: 160, emitterType: 'baseboard', priority: 2 },
      ];

      const map = buildComponentZoneMap(components, connections, zones);

      expect(map.get('rad1')).toBe('zone-2');
    });
  });

  describe('autoLayoutSystem', () => {
    it('should return positions for all components', () => {
      const components: Record<string, HydronicComponent> = {
        boiler1: createTestComponent('boiler1', 'boiler_gas', 'Boiler', 0, 0),
        pump1: createTestComponent('pump1', 'pump_variable', 'Pump', 0, 0),
        rad1: createTestComponent('rad1', 'baseboard', 'Radiator', 0, 0),
      };
      const pipes: Record<string, Pipe> = {
        pipe1: createTestPipe('pipe1', 'boiler1', 'supply', 'pump1', 'inlet'),
        pipe2: createTestPipe('pipe2', 'pump1', 'outlet', 'rad1', 'supply'),
      };
      const connections: Connection[] = [
        createTestConnection('conn1', 'pipe1', 'boiler1', 'supply', 'pump1', 'inlet'),
        createTestConnection('conn2', 'pipe2', 'pump1', 'outlet', 'rad1', 'supply'),
      ];
      const zones: Zone[] = [];

      const result = autoLayoutSystem(components, pipes, connections, zones);

      expect(result.componentPositions.size).toBe(3);
      expect(result.componentPositions.has('boiler1')).toBe(true);
      expect(result.componentPositions.has('pump1')).toBe(true);
      expect(result.componentPositions.has('rad1')).toBe(true);
    });

    it('should respect locked component positions', () => {
      const components: Record<string, HydronicComponent> = {
        boiler1: createTestComponent('boiler1', 'boiler_gas', 'Boiler', 100, 200),
        pump1: createTestComponent('pump1', 'pump_variable', 'Pump', 300, 400),
      };
      const pipes: Record<string, Pipe> = {};
      const connections: Connection[] = [];
      const zones: Zone[] = [];

      const result = autoLayoutSystem(components, pipes, connections, zones, {
        lockedComponentIds: new Set(['boiler1']),
      });

      // Locked component should keep its original position
      const boilerPos = result.componentPositions.get('boiler1');
      expect(boilerPos?.x).toBe(100);
      expect(boilerPos?.y).toBe(200);
    });

    it('should snap positions to grid', () => {
      const components: Record<string, HydronicComponent> = {
        boiler1: createTestComponent('boiler1', 'boiler_gas', 'Boiler', 0, 0),
      };
      const pipes: Record<string, Pipe> = {};
      const connections: Connection[] = [];
      const zones: Zone[] = [];

      const result = autoLayoutSystem(components, pipes, connections, zones, {
        gridSize: 20,
      });

      const pos = result.componentPositions.get('boiler1');
      expect(pos!.x % 20).toBe(0);
      expect(pos!.y % 20).toBe(0);
    });
  });

  describe('calculateZoneBounds', () => {
    it('should calculate bounding boxes for zones', () => {
      const components: Record<string, HydronicComponent> = {
        rad1: createTestComponent('rad1', 'baseboard', 'Rad 1', 100, 100),
        rad2: createTestComponent('rad2', 'baseboard', 'Rad 2', 200, 150),
      };
      const positions = new Map<string, Position>([
        ['rad1', { x: 100, y: 100 }],
        ['rad2', { x: 200, y: 150 }],
      ]);
      const componentZoneMap = new Map<string, string>([
        ['rad1', 'zone-1'],
        ['rad2', 'zone-1'],
      ]);
      const zones: Zone[] = [
        { id: 'zone-1', name: 'Test Zone', sqFt: 500, heatLossOverride: null, designWaterTemp: 160, emitterType: 'baseboard', priority: 1 },
      ];

      const bounds = calculateZoneBounds(components, positions, componentZoneMap, zones, 20);

      expect(bounds.length).toBe(1);
      expect(bounds[0].zoneId).toBe('zone-1');
      expect(bounds[0].zoneName).toBe('Test Zone');
      // Bounding box should contain both radiators with padding
      expect(bounds[0].x).toBe(80); // 100 - 20 padding
      expect(bounds[0].y).toBe(80); // 100 - 20 padding
    });

    it('should create mechanical room bounds', () => {
      const components: Record<string, HydronicComponent> = {
        boiler1: createTestComponent('boiler1', 'boiler_gas', 'Boiler', 50, 50),
        pump1: createTestComponent('pump1', 'pump_variable', 'Pump', 150, 50),
      };
      const positions = new Map<string, Position>([
        ['boiler1', { x: 50, y: 50 }],
        ['pump1', { x: 150, y: 50 }],
      ]);
      const componentZoneMap = new Map<string, string>([
        ['boiler1', 'mechanical'],
        ['pump1', 'mechanical'],
      ]);
      const zones: Zone[] = [];

      const bounds = calculateZoneBounds(components, positions, componentZoneMap, zones, 20);

      expect(bounds.length).toBe(1);
      expect(bounds[0].zoneId).toBe('mechanical');
      expect(bounds[0].zoneName).toBe('Mechanical Room');
    });
  });

  describe('generateSmartOrthogonalPath', () => {
    it('should generate L-shaped path for supply pipes', () => {
      const from = { x: 100, y: 100 };
      const to = { x: 300, y: 200 };

      const path = generateSmartOrthogonalPath(from, to, 'supply', 20);

      expect(path.length).toBe(4);
      expect(path[0]).toEqual(from);
      expect(path[path.length - 1]).toEqual(to);
      // All waypoints should have orthogonal segments (no diagonals)
      for (let i = 1; i < path.length; i++) {
        const dx = Math.abs(path[i].x - path[i - 1].x);
        const dy = Math.abs(path[i].y - path[i - 1].y);
        expect(dx === 0 || dy === 0).toBe(true);
      }
    });

    it('should generate header-style path for return pipes', () => {
      const from = { x: 100, y: 100 };
      const to = { x: 300, y: 100 };

      const path = generateSmartOrthogonalPath(from, to, 'return', 20);

      expect(path.length).toBe(4);
      expect(path[0]).toEqual(from);
      expect(path[path.length - 1]).toEqual(to);
      // Return pipes should go down first (to return header)
      expect(path[1].y).toBeGreaterThan(from.y);
    });
  });

  describe('recalculatePipeWaypoints', () => {
    it('should update waypoints for all connected pipes', () => {
      const components: Record<string, HydronicComponent> = {
        comp1: createTestComponent('comp1', 'boiler_gas', 'Boiler', 100, 100),
        comp2: createTestComponent('comp2', 'pump_variable', 'Pump', 300, 100),
      };
      const pipes: Record<string, Pipe> = {
        pipe1: createTestPipe('pipe1', 'comp1', 'supply', 'comp2', 'inlet'),
      };
      const connections: Connection[] = [
        createTestConnection('conn1', 'pipe1', 'comp1', 'supply', 'comp2', 'inlet'),
      ];
      const newPositions = new Map<string, Position>([
        ['comp1', { x: 100, y: 100 }],
        ['comp2', { x: 400, y: 200 }],
      ]);

      const newWaypoints = recalculatePipeWaypoints(components, pipes, connections, newPositions, 20);

      expect(newWaypoints.has('pipe1')).toBe(true);
      const waypoints = newWaypoints.get('pipe1')!;
      expect(waypoints.length).toBeGreaterThan(2);
    });
  });
});
