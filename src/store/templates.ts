// ─────────────────────────────────────────────────────────────────────────────
// System Templates - Pre-built hydronic configurations for quick start
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuid } from 'uuid';
import type {
  HydronicComponent,
  Pipe,
  Connection,
  Zone,
  BuildingConfig,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Template Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  building: BuildingConfig;
  zones: Zone[];
  components: Record<string, HydronicComponent>;
  pipes: Record<string, Pipe>;
  connections: Connection[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function createBoiler(id: string, name: string, x: number, y: number, inputBtu: number): HydronicComponent {
  return {
    id,
    type: 'boiler_gas',
    name,
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 15, y: 0 },
      { id: 'return', type: 'return', x: 65, y: 0 },
    ],
    zIndex: 1,
    props: {
      fuelType: 'natural_gas',
      inputBtu,
      afue: 0.95,
      boilerType: 'condensing',
      minFiringRate: 0.2,
      maxSupplyTemp: 180,
      minReturnTemp: 100,
      pressureDrop: 3,
      connectionSize: '1',
      electricalWatts: 150,
      controlType: 'modulating',
    },
  } as HydronicComponent;
}

function createPump(id: string, name: string, x: number, y: number, zIndex: number): HydronicComponent {
  return {
    id,
    type: 'pump_variable',
    name,
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'return', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex,
    props: {
      pumpType: 'variable_ecm',
      curve: [
        { gpm: 0, head: 25 },
        { gpm: 10, head: 22 },
        { gpm: 20, head: 15 },
        { gpm: 25, head: 10 },
      ],
      maxGpm: 25,
      maxHead: 25,
      watts: 87,
      connectionSize: '1',
      location: 'supply',
      control: 'delta_p',
      speedSetting: null,
    },
  } as HydronicComponent;
}

function createZoneValve(id: string, name: string, x: number, y: number, zIndex: number): HydronicComponent {
  return {
    id,
    type: 'zone_valve_2way',
    name,
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'supply', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex,
    props: {
      valveType: '2way',
      size: '3/4',
      cv: 4.0,
      actuatorType: 'motor',
      normallyOpen: false,
      hasEndSwitch: true,
      voltage: 24,
      pressureDrop: 0.5,
    },
  } as HydronicComponent;
}

function createBaseboard(id: string, name: string, x: number, y: number, lengthFt: number, zIndex: number): HydronicComponent {
  return {
    id,
    type: 'baseboard',
    name,
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 0, y: 30 },
      { id: 'return', type: 'return', x: lengthFt * 15, y: 30 },
    ],
    zIndex,
    props: {
      lengthFt,
      elementType: 'residential',
      btuPerFtAt180: 600,
      btuPerFtAt160: 470,
      btuPerFtAt140: 340,
      enclosureType: 'standard',
      connectionEnd: 'opposite',
    },
  } as HydronicComponent;
}

function createRadiantFloor(id: string, name: string, x: number, y: number, sqFt: number, zIndex: number): HydronicComponent {
  return {
    id,
    type: 'radiant_floor',
    name,
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 10, y: 0 },
      { id: 'return', type: 'return', x: 70, y: 60 },
    ],
    zIndex,
    props: {
      zoneArea: sqFt,
      tubingType: 'pex',
      tubingSize: '1/2',
      loopSpacing: 9,
      loopCount: Math.ceil(sqFt / 200),
      loopLength: 200,
      floorCovering: 'tile',
      subfloorType: 'concrete',
      manifoldLocation: 'mechanical',
      designDeltaT: 15,
    },
  } as HydronicComponent;
}

function createAirSeparator(id: string, x: number, y: number, zIndex: number): HydronicComponent {
  return {
    id,
    type: 'air_separator',
    name: 'Air Separator',
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'left', type: 'supply', x: 0, y: 30 },
      { id: 'right', type: 'supply', x: 60, y: 30 },
    ],
    zIndex,
    props: {},
  } as HydronicComponent;
}

function createExpansionTank(id: string, x: number, y: number, zIndex: number): HydronicComponent {
  return {
    id,
    type: 'expansion_tank',
    name: 'Expansion Tank',
    position: { x, y },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'connection', type: 'general', x: 30, y: 60 },
    ],
    zIndex,
    props: {
      tankType: 'diaphragm',
      volumeGal: 4.4,
      preChargePsi: 12,
      maxWorkingPsi: 60,
      connectionSize: '3/4',
    },
  } as HydronicComponent;
}

function createPipe(
  id: string,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  pipeType: 'supply' | 'return'
): Pipe {
  const midX = (fromPos.x + toPos.x) / 2;
  return {
    id,
    material: 'copper',
    size: '3/4',
    lengthFt: 10,
    pipeType,
    insulation: 'none',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      fromPos,
      { x: midX, y: fromPos.y },
      { x: midX, y: toPos.y },
      toPos,
    ],
    startPortId: null,
    endPortId: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Building Configs
// ─────────────────────────────────────────────────────────────────────────────

const smallHomeBuilding: BuildingConfig = {
  climate: {
    designOutdoorTemp: 5,
    indoorDesignTemp: 70,
    heatingDegreeDays: 5500,
    climateZone: 5,
  },
  totalSqFt: 1500,
  floors: 1,
  ceilingHeight: 8,
  foundationType: 'basement',
  constructionEra: '1980-2000',
  insulation: { walls: 13, ceiling: 38, floor: 19, basementWalls: 10 },
  windowDoor: {
    totalWindowArea: 150,
    windowUValue: 0.35,
    exteriorDoorCount: 2,
    doorUValue: 0.50,
    doorArea: 20,
  },
  infiltration: { ach: 0.35, blowerDoorCFM50: null },
};

const mediumHomeBuilding: BuildingConfig = {
  climate: {
    designOutdoorTemp: 0,
    indoorDesignTemp: 70,
    heatingDegreeDays: 6000,
    climateZone: 5,
  },
  totalSqFt: 2500,
  floors: 2,
  ceilingHeight: 9,
  foundationType: 'basement',
  constructionEra: '2000+',
  insulation: { walls: 19, ceiling: 49, floor: 25, basementWalls: 15 },
  windowDoor: {
    totalWindowArea: 280,
    windowUValue: 0.28,
    exteriorDoorCount: 2,
    doorUValue: 0.45,
    doorArea: 21,
  },
  infiltration: { ach: 0.25, blowerDoorCFM50: 1200 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Template: Single Zone Baseboard
// ─────────────────────────────────────────────────────────────────────────────

function createSingleZoneBaseboard(): SystemTemplate {
  const ids = {
    boiler: uuid(),
    pump: uuid(),
    airSep: uuid(),
    expTank: uuid(),
    bb1: uuid(),
    bb2: uuid(),
    bb3: uuid(),
  };

  const components: Record<string, HydronicComponent> = {
    [ids.boiler]: createBoiler(ids.boiler, 'Gas Boiler', 60, 100, 75000),
    [ids.pump]: createPump(ids.pump, 'Circulator', 180, 100, 2),
    [ids.airSep]: createAirSeparator(ids.airSep, 280, 100, 3),
    [ids.expTank]: createExpansionTank(ids.expTank, 280, 180, 4),
    [ids.bb1]: createBaseboard(ids.bb1, 'Living Room', 450, 60, 8, 5),
    [ids.bb2]: createBaseboard(ids.bb2, 'Bedroom 1', 450, 140, 6, 6),
    [ids.bb3]: createBaseboard(ids.bb3, 'Bedroom 2', 450, 220, 6, 7),
  };

  const pipes: Record<string, Pipe> = {};
  const connections: Connection[] = [];

  // Create supply loop
  const pipeIds = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];

  pipes[pipeIds[0]] = createPipe(pipeIds[0], { x: 75, y: 100 }, { x: 180, y: 130 }, 'supply');
  connections.push({ id: uuid(), pipeId: pipeIds[0], fromComponentId: ids.boiler, fromPortId: 'supply', toComponentId: ids.pump, toPortId: 'inlet' });

  pipes[pipeIds[1]] = createPipe(pipeIds[1], { x: 240, y: 130 }, { x: 280, y: 130 }, 'supply');
  connections.push({ id: uuid(), pipeId: pipeIds[1], fromComponentId: ids.pump, fromPortId: 'outlet', toComponentId: ids.airSep, toPortId: 'left' });

  pipes[pipeIds[2]] = createPipe(pipeIds[2], { x: 340, y: 130 }, { x: 450, y: 90 }, 'supply');
  connections.push({ id: uuid(), pipeId: pipeIds[2], fromComponentId: ids.airSep, fromPortId: 'right', toComponentId: ids.bb1, toPortId: 'supply' });

  return {
    id: 'single-zone-baseboard',
    name: 'Single Zone - Baseboard',
    description: 'Simple single-zone system with baseboard heaters. Great for small homes or additions.',
    icon: '🏠',
    building: smallHomeBuilding,
    zones: [
      {
        id: uuid(),
        name: 'Main Floor',
        sqFt: 1500,
        heatLossOverride: null,
        designWaterTemp: 160,
        emitterType: 'baseboard',
        priority: 1,
      },
    ],
    components,
    pipes,
    connections,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Template: Two Zone with Zone Valves
// ─────────────────────────────────────────────────────────────────────────────

function createTwoZoneValves(): SystemTemplate {
  const ids = {
    boiler: uuid(),
    pump: uuid(),
    airSep: uuid(),
    expTank: uuid(),
    zv1: uuid(),
    zv2: uuid(),
    bb1: uuid(),
    bb2: uuid(),
    bb3: uuid(),
    bb4: uuid(),
  };

  const components: Record<string, HydronicComponent> = {
    [ids.boiler]: createBoiler(ids.boiler, 'Gas Boiler', 60, 150, 100000),
    [ids.pump]: createPump(ids.pump, 'Primary Pump', 180, 150, 2),
    [ids.airSep]: createAirSeparator(ids.airSep, 280, 150, 3),
    [ids.expTank]: createExpansionTank(ids.expTank, 280, 240, 4),
    [ids.zv1]: createZoneValve(ids.zv1, 'Zone 1 Valve', 400, 80, 5),
    [ids.zv2]: createZoneValve(ids.zv2, 'Zone 2 Valve', 400, 220, 6),
    [ids.bb1]: createBaseboard(ids.bb1, 'Zone 1 - Living', 520, 60, 8, 7),
    [ids.bb2]: createBaseboard(ids.bb2, 'Zone 1 - Kitchen', 520, 120, 6, 8),
    [ids.bb3]: createBaseboard(ids.bb3, 'Zone 2 - Bedroom 1', 520, 200, 6, 9),
    [ids.bb4]: createBaseboard(ids.bb4, 'Zone 2 - Bedroom 2', 520, 260, 6, 10),
  };

  return {
    id: 'two-zone-valves',
    name: 'Two Zone - Zone Valves',
    description: 'Two-zone system using zone valves with a single circulator. Ideal for 2-story homes.',
    icon: '🏡',
    building: mediumHomeBuilding,
    zones: [
      {
        id: uuid(),
        name: 'First Floor',
        sqFt: 1250,
        heatLossOverride: null,
        designWaterTemp: 160,
        emitterType: 'baseboard',
        priority: 1,
      },
      {
        id: uuid(),
        name: 'Second Floor',
        sqFt: 1250,
        heatLossOverride: null,
        designWaterTemp: 160,
        emitterType: 'baseboard',
        priority: 2,
      },
    ],
    components,
    pipes: {},
    connections: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Template: Radiant Floor Single Zone
// ─────────────────────────────────────────────────────────────────────────────

function createRadiantFloorSingle(): SystemTemplate {
  const ids = {
    boiler: uuid(),
    pump: uuid(),
    mixingValve: uuid(),
    airSep: uuid(),
    expTank: uuid(),
    radiant: uuid(),
  };

  const components: Record<string, HydronicComponent> = {
    [ids.boiler]: createBoiler(ids.boiler, 'Condensing Boiler', 60, 120, 60000),
    [ids.pump]: createPump(ids.pump, 'Primary Pump', 180, 120, 2),
    [ids.airSep]: createAirSeparator(ids.airSep, 280, 120, 3),
    [ids.expTank]: createExpansionTank(ids.expTank, 280, 200, 4),
    [ids.radiant]: createRadiantFloor(ids.radiant, 'Main Floor Radiant', 450, 100, 1200, 6),
  };

  return {
    id: 'radiant-single',
    name: 'Radiant Floor - Single Zone',
    description: 'Single radiant floor zone with mixing valve. Perfect for open floor plans.',
    icon: '🔥',
    building: {
      ...smallHomeBuilding,
      foundationType: 'slab',
    },
    zones: [
      {
        id: uuid(),
        name: 'Radiant Floor',
        sqFt: 1200,
        heatLossOverride: null,
        designWaterTemp: 110,
        emitterType: 'radiant_floor',
        priority: 1,
      },
    ],
    components,
    pipes: {},
    connections: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Template: Empty - Start Fresh
// ─────────────────────────────────────────────────────────────────────────────

function createEmptyTemplate(): SystemTemplate {
  return {
    id: 'empty',
    name: 'Empty - Start Fresh',
    description: 'Start with a blank canvas. Configure your building and add components manually.',
    icon: '📝',
    building: {
      climate: {
        designOutdoorTemp: 0,
        indoorDesignTemp: 70,
        heatingDegreeDays: 6000,
        climateZone: 5,
      },
      totalSqFt: 2000,
      floors: 2,
      ceilingHeight: 9,
      foundationType: 'basement',
      constructionEra: '2000+',
      insulation: { walls: 19, ceiling: 49, floor: 25, basementWalls: 15 },
      windowDoor: {
        totalWindowArea: 200,
        windowUValue: 0.30,
        exteriorDoorCount: 2,
        doorUValue: 0.45,
        doorArea: 21,
      },
      infiltration: { ach: 0.25, blowerDoorCFM50: null },
    },
    zones: [],
    components: {},
    pipes: {},
    connections: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export All Templates
// ─────────────────────────────────────────────────────────────────────────────

export const systemTemplates: SystemTemplate[] = [
  createEmptyTemplate(),
  createSingleZoneBaseboard(),
  createTwoZoneValves(),
  createRadiantFloorSingle(),
];

export function getTemplateById(id: string): SystemTemplate | undefined {
  return systemTemplates.find(t => t.id === id);
}
