// ─────────────────────────────────────────────────────────────────────────────
// Demo System – Pre-built hydronic system for first-time users
// A realistic 2-zone system:
//   Zone 1: Baseboard radiators in series (living room/kitchen)
//   Zone 2: Radiant floor loop (master bedroom)
// ─────────────────────────────────────────────────────────────────────────────
import type {
  HydronicComponent,
  Pipe,
  Connection,
  Zone,
  BuildingConfig,
  SimulationState,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Component IDs (static for reproducible demo)
// ─────────────────────────────────────────────────────────────────────────────
const IDS = {
  boiler: 'demo-boiler',
  primaryPump: 'demo-primary-pump',
  airSeparator: 'demo-air-separator',
  expansionTank: 'demo-expansion-tank',
  zone1Valve: 'demo-zone1-valve',
  zone2Valve: 'demo-zone2-valve',
  baseboard1: 'demo-baseboard-1',
  baseboard2: 'demo-baseboard-2',
  radiantFloor: 'demo-radiant-floor',
};

const PIPE_IDS = {
  boilerToAirSep: 'demo-pipe-boiler-airsep',
  airSepToTee: 'demo-pipe-airsep-tee',
  teeToZone1Valve: 'demo-pipe-tee-zone1',
  teeToZone2Valve: 'demo-pipe-tee-zone2',
  zone1ValveToBb1: 'demo-pipe-z1-bb1',
  bb1ToBb2: 'demo-pipe-bb1-bb2',
  bb2ToReturn: 'demo-pipe-bb2-return',
  zone2ValveToRadiant: 'demo-pipe-z2-radiant',
  radiantToReturn: 'demo-pipe-radiant-return',
  returnToBoiler: 'demo-pipe-return-boiler',
  pumpToBoiler: 'demo-pipe-pump-boiler',
  expansionConn: 'demo-pipe-expansion',
};

// ─────────────────────────────────────────────────────────────────────────────
// Building Configuration
// ─────────────────────────────────────────────────────────────────────────────
export const demoBuildingConfig: BuildingConfig = {
  climate: {
    designOutdoorTemp: -5,
    indoorDesignTemp: 70,
    heatingDegreeDays: 6200,
    climateZone: 5,
  },
  totalSqFt: 2400,
  floors: 1,
  ceilingHeight: 9,
  foundationType: 'basement',
  constructionEra: '2000+',
  insulation: {
    walls: 19,
    ceiling: 49,
    floor: 25,
    basementWalls: 15,
  },
  windowDoor: {
    totalWindowArea: 280,
    windowUValue: 0.28,
    exteriorDoorCount: 2,
    doorUValue: 0.45,
    doorArea: 21,
  },
  infiltration: {
    ach: 0.25,
    blowerDoorCFM50: 1200,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Zones
// ─────────────────────────────────────────────────────────────────────────────
export const demoZones: Zone[] = [
  {
    id: 'demo-zone-1',
    name: 'Living Room & Kitchen',
    sqFt: 1400,
    heatLossOverride: null,
    designWaterTemp: 160,
    emitterType: 'baseboard',
    priority: 1,
  },
  {
    id: 'demo-zone-2',
    name: 'Master Bedroom',
    sqFt: 400,
    heatLossOverride: null,
    designWaterTemp: 120,
    emitterType: 'radiant_floor',
    priority: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Components Layout - arranged for clear visual flow
// Left side: Boiler and pump stack (mechanical room)
// Top: Air separator with expansion tank
// Right top: Zone 1 (baseboards in series)
// Right bottom: Zone 2 (radiant floor)
// ─────────────────────────────────────────────────────────────────────────────
export const demoComponents: Record<string, HydronicComponent> = {
  [IDS.boiler]: {
    id: IDS.boiler,
    type: 'boiler_gas',
    name: 'Gas Boiler 95%',
    position: { x: 60, y: 260 },
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
      inputBtu: 100000,
      afue: 0.95,
      boilerType: 'condensing',
      minFiringRate: 0.2,
      maxSupplyTemp: 180,
      minReturnTemp: 120,
      pressureDrop: 4,
      connectionSize: '1',
      electricalWatts: 150,
      controlType: 'modulating',
    },
  },
  [IDS.primaryPump]: {
    id: IDS.primaryPump,
    type: 'pump_fixed',
    name: 'Primary Pump',
    position: { x: 180, y: 160 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'return', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex: 2,
    props: {
      pumpType: '3speed',
      curve: [
        { gpm: 0, head: 18 },
        { gpm: 5, head: 16 },
        { gpm: 10, head: 12 },
        { gpm: 15, head: 6 },
        { gpm: 18, head: 0 },
      ],
      maxGpm: 18,
      maxHead: 18,
      watts: 85,
      connectionSize: '3/4',
      location: 'supply',
      control: 'always_on',
      speedSetting: 'med',
    },
  },
  [IDS.airSeparator]: {
    id: IDS.airSeparator,
    type: 'air_separator',
    name: 'Air Separator',
    position: { x: 300, y: 160 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'left', type: 'general', x: 0, y: 30 },
      { id: 'right', type: 'general', x: 60, y: 30 },
    ],
    zIndex: 3,
    props: {
      separatorType: 'microbubble',
      size: '3/4',
      maxGpm: 20,
      pressureDrop: 0.5,
    },
  },
  [IDS.expansionTank]: {
    id: IDS.expansionTank,
    type: 'expansion_tank',
    name: 'Exp. Tank 4.4 gal',
    position: { x: 300, y: 60 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'connection', type: 'general', x: 30, y: 60 },
    ],
    zIndex: 4,
    props: {
      tankType: 'diaphragm',
      volumeGal: 4.4,
      acceptanceVolumeGal: 2.8,
      preChargePsi: 12,
      maxWorkingPsi: 60,
      connectionSize: '1/2',
    },
  },
  [IDS.zone1Valve]: {
    id: IDS.zone1Valve,
    type: 'zone_valve_2way',
    name: 'Zone 1 Valve',
    position: { x: 460, y: 100 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'return', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex: 5,
    props: {
      valveType: '2way',
      size: '3/4',
      cv: 4.0,
      actuatorType: 'motor',
      normallyOpen: false,
      hasEndSwitch: true,
      voltage: 24,
      pressureDrop: 1.2,
    },
  },
  [IDS.zone2Valve]: {
    id: IDS.zone2Valve,
    type: 'zone_valve_2way',
    name: 'Zone 2 Valve',
    position: { x: 460, y: 260 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'return', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex: 6,
    props: {
      valveType: '2way',
      size: '3/4',
      cv: 4.0,
      actuatorType: 'motor',
      normallyOpen: false,
      hasEndSwitch: true,
      voltage: 24,
      pressureDrop: 1.2,
    },
  },
  [IDS.baseboard1]: {
    id: IDS.baseboard1,
    type: 'baseboard',
    name: 'Living Room BB',
    position: { x: 600, y: 80 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 0, y: 30 },
      { id: 'return', type: 'return', x: 120, y: 30 },
    ],
    zIndex: 7,
    props: {
      lengthFt: 8,
      elementType: 'residential',
      btuPerFtAt180: 600,
      btuPerFtAt160: 480,
      btuPerFtAt140: 360,
      enclosureType: 'high_output',
      connectionEnd: 'opposite',
    },
  },
  [IDS.baseboard2]: {
    id: IDS.baseboard2,
    type: 'baseboard',
    name: 'Kitchen BB',
    position: { x: 760, y: 80 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 0, y: 30 },
      { id: 'return', type: 'return', x: 90, y: 30 },
    ],
    zIndex: 8,
    props: {
      lengthFt: 6,
      elementType: 'residential',
      btuPerFtAt180: 600,
      btuPerFtAt160: 480,
      btuPerFtAt140: 360,
      enclosureType: 'standard',
      connectionEnd: 'opposite',
    },
  },
  [IDS.radiantFloor]: {
    id: IDS.radiantFloor,
    type: 'radiant_floor',
    name: 'Master BR Radiant',
    position: { x: 600, y: 240 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 10, y: 0 },
      { id: 'return', type: 'return', x: 70, y: 60 },
    ],
    zIndex: 9,
    props: {
      zoneArea: 400,
      tubingType: 'pex',
      tubingSize: '1/2',
      loopSpacing: 9,
      loopCount: 4,
      loopLength: 280,
      installationType: 'thin_slab',
      floorCoveringRValue: 1.0,
      designWaterTemp: 120,
      designFloorSurfaceTemp: 85,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Pipes - calculated based on component positions and port locations
// ─────────────────────────────────────────────────────────────────────────────

// Component positions (must match demoComponents above)
const COMP_POS = {
  boiler: { x: 60, y: 260 },
  pump: { x: 180, y: 160 },
  airSep: { x: 300, y: 160 },
  expTank: { x: 300, y: 60 },
  zone1Valve: { x: 460, y: 100 },
  zone2Valve: { x: 460, y: 260 },
  bb1: { x: 600, y: 80 },
  bb2: { x: 760, y: 80 },
  radiant: { x: 600, y: 240 },
};

// Calculate actual port positions (component position + port offset)
const PORTS = {
  boilerSupply: { x: COMP_POS.boiler.x + 15, y: COMP_POS.boiler.y }, // cy=0
  boilerReturn: { x: COMP_POS.boiler.x + 65, y: COMP_POS.boiler.y }, // cy=0
  pumpInlet: { x: COMP_POS.pump.x, y: COMP_POS.pump.y + 30 },
  pumpOutlet: { x: COMP_POS.pump.x + 60, y: COMP_POS.pump.y + 30 },
  airSepLeft: { x: COMP_POS.airSep.x, y: COMP_POS.airSep.y + 30 },
  airSepRight: { x: COMP_POS.airSep.x + 60, y: COMP_POS.airSep.y + 30 },
  expTankConn: { x: COMP_POS.expTank.x + 30, y: COMP_POS.expTank.y + 60 },
  zone1Inlet: { x: COMP_POS.zone1Valve.x, y: COMP_POS.zone1Valve.y + 30 },
  zone1Outlet: { x: COMP_POS.zone1Valve.x + 60, y: COMP_POS.zone1Valve.y + 30 },
  zone2Inlet: { x: COMP_POS.zone2Valve.x, y: COMP_POS.zone2Valve.y + 30 },
  zone2Outlet: { x: COMP_POS.zone2Valve.x + 60, y: COMP_POS.zone2Valve.y + 30 },
  bb1Supply: { x: COMP_POS.bb1.x, y: COMP_POS.bb1.y + 30 },
  bb1Return: { x: COMP_POS.bb1.x + 120, y: COMP_POS.bb1.y + 30 }, // 8ft baseboard
  bb2Supply: { x: COMP_POS.bb2.x, y: COMP_POS.bb2.y + 30 },
  bb2Return: { x: COMP_POS.bb2.x + 90, y: COMP_POS.bb2.y + 30 }, // 6ft baseboard
  radiantSupply: { x: COMP_POS.radiant.x + 10, y: COMP_POS.radiant.y },
  radiantReturn: { x: COMP_POS.radiant.x + 70, y: COMP_POS.radiant.y + 60 },
};

export const demoPipes: Record<string, Pipe> = {
  // Boiler supply up to pump inlet
  [PIPE_IDS.pumpToBoiler]: {
    id: PIPE_IDS.pumpToBoiler,
    material: 'copper',
    size: '3/4',
    lengthFt: 3,
    pipeType: 'supply',
    insulation: '0.5',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      PORTS.boilerSupply,
      { x: PORTS.boilerSupply.x, y: PORTS.pumpInlet.y },
      PORTS.pumpInlet,
    ],
    startPortId: `${IDS.boiler}.supply`,
    endPortId: `${IDS.primaryPump}.inlet`,
  },
  // Pump outlet to air separator
  [PIPE_IDS.boilerToAirSep]: {
    id: PIPE_IDS.boilerToAirSep,
    material: 'copper',
    size: '3/4',
    lengthFt: 4,
    pipeType: 'supply',
    insulation: '0.5',
    fittings: { elbows90: 1, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      PORTS.pumpOutlet,
      PORTS.airSepLeft,
    ],
    startPortId: `${IDS.primaryPump}.outlet`,
    endPortId: `${IDS.airSeparator}.left`,
  },
  // Air separator to expansion tank (tee up)
  [PIPE_IDS.expansionConn]: {
    id: PIPE_IDS.expansionConn,
    material: 'copper',
    size: '1/2',
    lengthFt: 2,
    pipeType: 'supply',
    insulation: 'none',
    fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 1, couplings: 0 },
    waypoints: [
      { x: PORTS.expTankConn.x, y: PORTS.airSepLeft.y },
      PORTS.expTankConn,
    ],
    startPortId: `${IDS.airSeparator}.left`,
    endPortId: `${IDS.expansionTank}.connection`,
  },
  // Air separator to zone 1 valve (through tee point at x=420)
  [PIPE_IDS.teeToZone1Valve]: {
    id: PIPE_IDS.teeToZone1Valve,
    material: 'copper',
    size: '3/4',
    lengthFt: 5,
    pipeType: 'supply',
    insulation: '0.5',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 1, couplings: 0 },
    waypoints: [
      PORTS.airSepRight,
      { x: 420, y: PORTS.airSepRight.y },
      { x: 420, y: PORTS.zone1Inlet.y },
      PORTS.zone1Inlet,
    ],
    startPortId: `${IDS.airSeparator}.right`,
    endPortId: `${IDS.zone1Valve}.inlet`,
  },
  // Supply tee down to zone 2 valve (branches from tee point)
  [PIPE_IDS.teeToZone2Valve]: {
    id: PIPE_IDS.teeToZone2Valve,
    material: 'copper',
    size: '3/4',
    lengthFt: 5,
    pipeType: 'supply',
    insulation: '0.5',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      { x: 420, y: PORTS.airSepRight.y },
      { x: 420, y: PORTS.zone2Inlet.y },
      PORTS.zone2Inlet,
    ],
    startPortId: `${IDS.airSeparator}.right`,
    endPortId: `${IDS.zone2Valve}.inlet`,
  },
  // Zone 1 valve to baseboard 1
  [PIPE_IDS.zone1ValveToBb1]: {
    id: PIPE_IDS.zone1ValveToBb1,
    material: 'copper',
    size: '3/4',
    lengthFt: 3,
    pipeType: 'supply',
    insulation: 'none',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      PORTS.zone1Outlet,
      { x: 560, y: PORTS.zone1Outlet.y },
      { x: 560, y: PORTS.bb1Supply.y },
      PORTS.bb1Supply,
    ],
    startPortId: `${IDS.zone1Valve}.outlet`,
    endPortId: `${IDS.baseboard1}.supply`,
  },
  // Baseboard 1 to baseboard 2 (series - horizontal connection)
  [PIPE_IDS.bb1ToBb2]: {
    id: PIPE_IDS.bb1ToBb2,
    material: 'copper',
    size: '3/4',
    lengthFt: 2,
    pipeType: 'supply',
    insulation: 'none',
    fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 1 },
    waypoints: [
      PORTS.bb1Return,
      PORTS.bb2Supply,
    ],
    startPortId: `${IDS.baseboard1}.return`,
    endPortId: `${IDS.baseboard2}.supply`,
  },
  // Baseboard 2 return to boiler (loop back under)
  [PIPE_IDS.bb2ToReturn]: {
    id: PIPE_IDS.bb2ToReturn,
    material: 'copper',
    size: '3/4',
    lengthFt: 12,
    pipeType: 'return',
    insulation: '0.5',
    fittings: { elbows90: 4, elbows45: 0, teesThrough: 0, teesBranch: 1, couplings: 0 },
    waypoints: [
      PORTS.bb2Return,
      { x: PORTS.bb2Return.x + 30, y: PORTS.bb2Return.y },
      { x: PORTS.bb2Return.x + 30, y: 380 },
      { x: PORTS.boilerReturn.x, y: 380 },
      PORTS.boilerReturn,
    ],
    startPortId: `${IDS.baseboard2}.return`,
    endPortId: `${IDS.boiler}.return`,
  },
  // Zone 2 valve to radiant floor supply
  [PIPE_IDS.zone2ValveToRadiant]: {
    id: PIPE_IDS.zone2ValveToRadiant,
    material: 'pex',
    size: '1/2',
    lengthFt: 3,
    pipeType: 'supply',
    insulation: 'none',
    fittings: { elbows90: 2, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      PORTS.zone2Outlet,
      { x: 560, y: PORTS.zone2Outlet.y },
      { x: 560, y: PORTS.radiantSupply.y },
      PORTS.radiantSupply,
    ],
    startPortId: `${IDS.zone2Valve}.outlet`,
    endPortId: `${IDS.radiantFloor}.supply`,
  },
  // Radiant floor return to boiler (loop back under)
  [PIPE_IDS.radiantToReturn]: {
    id: PIPE_IDS.radiantToReturn,
    material: 'pex',
    size: '1/2',
    lengthFt: 15,
    pipeType: 'return',
    insulation: 'none',
    fittings: { elbows90: 3, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints: [
      PORTS.radiantReturn,
      { x: PORTS.radiantReturn.x, y: 360 },
      { x: PORTS.boilerReturn.x, y: 360 },
      PORTS.boilerReturn,
    ],
    startPortId: `${IDS.radiantFloor}.return`,
    endPortId: `${IDS.boiler}.return`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connections
// ─────────────────────────────────────────────────────────────────────────────
export const demoConnections: Connection[] = [
  {
    id: 'demo-conn-1',
    pipeId: PIPE_IDS.pumpToBoiler,
    fromComponentId: IDS.boiler,
    fromPortId: 'supply',
    toComponentId: IDS.primaryPump,
    toPortId: 'inlet',
  },
  {
    id: 'demo-conn-2',
    pipeId: PIPE_IDS.boilerToAirSep,
    fromComponentId: IDS.primaryPump,
    fromPortId: 'outlet',
    toComponentId: IDS.airSeparator,
    toPortId: 'left',
  },
  {
    id: 'demo-conn-3',
    pipeId: PIPE_IDS.expansionConn,
    fromComponentId: IDS.airSeparator,
    fromPortId: 'left',
    toComponentId: IDS.expansionTank,
    toPortId: 'connection',
  },
  {
    id: 'demo-conn-4',
    pipeId: PIPE_IDS.teeToZone1Valve,
    fromComponentId: IDS.airSeparator,
    fromPortId: 'right',
    toComponentId: IDS.zone1Valve,
    toPortId: 'inlet',
  },
  {
    id: 'demo-conn-5',
    pipeId: PIPE_IDS.teeToZone2Valve,
    fromComponentId: IDS.airSeparator,
    fromPortId: 'right',
    toComponentId: IDS.zone2Valve,
    toPortId: 'inlet',
  },
  {
    id: 'demo-conn-6',
    pipeId: PIPE_IDS.zone1ValveToBb1,
    fromComponentId: IDS.zone1Valve,
    fromPortId: 'outlet',
    toComponentId: IDS.baseboard1,
    toPortId: 'supply',
  },
  {
    id: 'demo-conn-7',
    pipeId: PIPE_IDS.bb1ToBb2,
    fromComponentId: IDS.baseboard1,
    fromPortId: 'return',
    toComponentId: IDS.baseboard2,
    toPortId: 'supply',
  },
  {
    id: 'demo-conn-8',
    pipeId: PIPE_IDS.bb2ToReturn,
    fromComponentId: IDS.baseboard2,
    fromPortId: 'return',
    toComponentId: IDS.boiler,
    toPortId: 'return',
  },
  {
    id: 'demo-conn-9',
    pipeId: PIPE_IDS.zone2ValveToRadiant,
    fromComponentId: IDS.zone2Valve,
    fromPortId: 'outlet',
    toComponentId: IDS.radiantFloor,
    toPortId: 'supply',
  },
  {
    id: 'demo-conn-10',
    pipeId: PIPE_IDS.radiantToReturn,
    fromComponentId: IDS.radiantFloor,
    fromPortId: 'return',
    toComponentId: IDS.boiler,
    toPortId: 'return',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Simulation State - start running to wow the user
// ─────────────────────────────────────────────────────────────────────────────
export const demoSimulationState: SimulationState = {
  settings: {
    running: true,
    paused: false,
    timeScale: 1,
    outdoorTemp: 25,
    elapsedSeconds: 0,
  },
  componentStates: {
    [IDS.boiler]: {
      supplyTemp: 165,
      returnTemp: 145,
      flowGpm: 8,
      status: 'firing',
    },
    [IDS.primaryPump]: {
      supplyTemp: 165,
      returnTemp: 145,
      flowGpm: 8,
      status: 'running',
    },
    [IDS.zone1Valve]: {
      supplyTemp: 160,
      returnTemp: 140,
      flowGpm: 4.5,
      status: 'running',
    },
    [IDS.zone2Valve]: {
      supplyTemp: 120,
      returnTemp: 100,
      flowGpm: 2.5,
      status: 'running',
    },
    [IDS.baseboard1]: {
      supplyTemp: 160,
      returnTemp: 150,
      flowGpm: 4.5,
      status: 'running',
    },
    [IDS.baseboard2]: {
      supplyTemp: 150,
      returnTemp: 140,
      flowGpm: 4.5,
      status: 'running',
    },
    [IDS.radiantFloor]: {
      supplyTemp: 120,
      returnTemp: 100,
      flowGpm: 2.5,
      status: 'running',
    },
  },
};
