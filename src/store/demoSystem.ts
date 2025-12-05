// ─────────────────────────────────────────────────────────────────────────────
// Demo System – Pre-built 3-zone hydronic system for first-time users
// A realistic 3-story home:
//   Zone 1 (Floor 1 - Garage): Radiant floor with 4 loops
//   Zone 2 (Floor 2): 9 panel radiators (office, living room, kitchen, dining, foyer)
//   Zone 3 (Floor 3): 9 panel radiators (4 bedrooms, office, bathroom)
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
  // Mechanical room
  boiler: 'demo-boiler',
  primaryPump: 'demo-primary-pump',
  airSeparator: 'demo-air-separator',
  expansionTank: 'demo-expansion-tank',
  
  // Zone valves
  zone1Valve: 'demo-zone1-valve',
  zone2Valve: 'demo-zone2-valve',
  zone3Valve: 'demo-zone3-valve',
  
  // Zone 1 - Garage radiant (Floor 1)
  radiantGarage: 'demo-radiant-garage',
  
  // Zone 2 - 2nd floor radiators
  rad2Office: 'demo-rad-2-office',
  rad2Living1: 'demo-rad-2-living1',
  rad2Living2: 'demo-rad-2-living2',
  rad2Kitchen1: 'demo-rad-2-kitchen1',
  rad2Kitchen2: 'demo-rad-2-kitchen2',
  rad2Dining1: 'demo-rad-2-dining1',
  rad2Dining2: 'demo-rad-2-dining2',
  rad2Foyer1: 'demo-rad-2-foyer1',
  rad2Foyer2: 'demo-rad-2-foyer2',
  
  // Zone 3 - 3rd floor radiators
  rad3Bed1: 'demo-rad-3-bed1',
  rad3Bed2: 'demo-rad-3-bed2',
  rad3Bed3: 'demo-rad-3-bed3',
  rad3Bed4: 'demo-rad-3-bed4',
  rad3MasterBed1: 'demo-rad-3-master1',
  rad3MasterBed2: 'demo-rad-3-master2',
  rad3Office: 'demo-rad-3-office',
  rad3Bath1: 'demo-rad-3-bath1',
  rad3Bath2: 'demo-rad-3-bath2',
};

// ─────────────────────────────────────────────────────────────────────────────
// Building Configuration - 3-story home
// ─────────────────────────────────────────────────────────────────────────────
export const demoBuildingConfig: BuildingConfig = {
  climate: {
    designOutdoorTemp: -5,
    indoorDesignTemp: 70,
    heatingDegreeDays: 6500,
    climateZone: 5,
  },
  totalSqFt: 4200,
  floors: 3,
  ceilingHeight: 9,
  foundationType: 'slab',
  constructionEra: '2000+',
  insulation: {
    walls: 21,
    ceiling: 49,
    floor: 30,
    basementWalls: 15,
  },
  windowDoor: {
    totalWindowArea: 380,
    windowUValue: 0.25,
    exteriorDoorCount: 3,
    doorUValue: 0.40,
    doorArea: 21,
  },
  infiltration: {
    ach: 0.20,
    blowerDoorCFM50: 1000,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Zones
// ─────────────────────────────────────────────────────────────────────────────
export const demoZones: Zone[] = [
  {
    id: 'demo-zone-1',
    name: 'Floor 1 - Garage (Radiant)',
    sqFt: 800,
    heatLossOverride: null,
    designWaterTemp: 110,
    emitterType: 'radiant_floor',
    priority: 3,
  },
  {
    id: 'demo-zone-2',
    name: 'Floor 2 - Main Living',
    sqFt: 1800,
    heatLossOverride: null,
    designWaterTemp: 160,
    emitterType: 'panel_radiator',
    priority: 1,
  },
  {
    id: 'demo-zone-3',
    name: 'Floor 3 - Bedrooms',
    sqFt: 1600,
    heatLossOverride: null,
    designWaterTemp: 160,
    emitterType: 'panel_radiator',
    priority: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Layout Constants - organized by floor/section
// Mechanical room on left, zones spread horizontally
// ─────────────────────────────────────────────────────────────────────────────
const Y_MECH = 300;        // Mechanical room Y position
const Y_ZONE1 = 480;       // Zone 1 (garage radiant) row
const Y_ZONE2_ROW1 = 60;   // Zone 2 first row
const Y_ZONE2_ROW2 = 160;  // Zone 2 second row
const Y_ZONE3_ROW1 = 640;  // Zone 3 first row
const Y_ZONE3_ROW2 = 740;  // Zone 3 second row

const X_MECH = 60;         // Mechanical room X start
const X_ZONES = 500;       // Zone components X start
const RAD_SPACING = 150;   // Horizontal spacing between radiators

// ─────────────────────────────────────────────────────────────────────────────
// Components Layout
// ─────────────────────────────────────────────────────────────────────────────

// Helper to create a panel radiator component
function createRadiator(
  id: string,
  name: string,
  x: number,
  y: number,
  lengthFt: number,
  zIndex: number
): HydronicComponent {
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
      btuPerFtAt180: 700,
      btuPerFtAt160: 550,
      btuPerFtAt140: 400,
      enclosureType: 'high_output',
      connectionEnd: 'opposite',
    },
  } as HydronicComponent;
}

export const demoComponents: Record<string, HydronicComponent> = {
  // ─── Mechanical Room ───────────────────────────────────────────────────────
  [IDS.boiler]: {
    id: IDS.boiler,
    type: 'boiler_gas',
    name: 'Gas Boiler 150k BTU',
    position: { x: X_MECH, y: Y_MECH },
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
      inputBtu: 150000,
      afue: 0.95,
      boilerType: 'condensing',
      minFiringRate: 0.15,
      maxSupplyTemp: 180,
      minReturnTemp: 100,
      pressureDrop: 5,
      connectionSize: '1-1/4',
      electricalWatts: 180,
      controlType: 'modulating',
    },
  },
  [IDS.primaryPump]: {
    id: IDS.primaryPump,
    type: 'pump_variable',
    name: 'Variable Speed Pump',
    position: { x: X_MECH + 140, y: Y_MECH - 100 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'return', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex: 2,
    props: {
      pumpType: 'variable_ecm',
      curve: [
        { gpm: 0, head: 25 },
        { gpm: 8, head: 22 },
        { gpm: 15, head: 18 },
        { gpm: 22, head: 12 },
        { gpm: 28, head: 0 },
      ],
      maxGpm: 28,
      maxHead: 25,
      watts: 120,
      connectionSize: '1',
      location: 'supply',
      control: 'delta_p',
      speedSetting: null,
    },
  },
  [IDS.airSeparator]: {
    id: IDS.airSeparator,
    type: 'air_separator',
    name: 'Air Separator',
    position: { x: X_MECH + 260, y: Y_MECH - 100 },
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
      size: '1',
      maxGpm: 30,
      pressureDrop: 0.5,
    },
  },
  [IDS.expansionTank]: {
    id: IDS.expansionTank,
    type: 'expansion_tank',
    name: 'Exp. Tank 8 gal',
    position: { x: X_MECH + 260, y: Y_MECH - 200 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'connection', type: 'general', x: 30, y: 60 },
    ],
    zIndex: 4,
    props: {
      tankType: 'diaphragm',
      volumeGal: 8,
      acceptanceVolumeGal: 5,
      preChargePsi: 12,
      maxWorkingPsi: 60,
      connectionSize: '3/4',
    },
  },

  // ─── Zone Valves ───────────────────────────────────────────────────────────
  [IDS.zone1Valve]: {
    id: IDS.zone1Valve,
    type: 'zone_valve_2way',
    name: 'Zone 1 Valve (Garage)',
    position: { x: X_ZONES - 60, y: Y_ZONE1 },
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
    name: 'Zone 2 Valve (Floor 2)',
    position: { x: X_ZONES - 60, y: Y_ZONE2_ROW1 + 30 },
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
      size: '1',
      cv: 6.0,
      actuatorType: 'motor',
      normallyOpen: false,
      hasEndSwitch: true,
      voltage: 24,
      pressureDrop: 1.5,
    },
  },
  [IDS.zone3Valve]: {
    id: IDS.zone3Valve,
    type: 'zone_valve_2way',
    name: 'Zone 3 Valve (Floor 3)',
    position: { x: X_ZONES - 60, y: Y_ZONE3_ROW1 + 30 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'inlet', type: 'return', x: 0, y: 30 },
      { id: 'outlet', type: 'supply', x: 60, y: 30 },
    ],
    zIndex: 7,
    props: {
      valveType: '2way',
      size: '1',
      cv: 6.0,
      actuatorType: 'motor',
      normallyOpen: false,
      hasEndSwitch: true,
      voltage: 24,
      pressureDrop: 1.5,
    },
  },

  // ─── Zone 1 - Garage Radiant Floor ─────────────────────────────────────────
  [IDS.radiantGarage]: {
    id: IDS.radiantGarage,
    type: 'radiant_floor',
    name: 'Garage Radiant (4 loops)',
    position: { x: X_ZONES + 60, y: Y_ZONE1 - 10 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [
      { id: 'supply', type: 'supply', x: 10, y: 0 },
      { id: 'return', type: 'return', x: 70, y: 60 },
    ],
    zIndex: 10,
    props: {
      zoneArea: 800,
      tubingType: 'pex',
      tubingSize: '1/2',
      loopSpacing: 12,
      loopCount: 4,
      loopLength: 200,
      installationType: 'slab_on_grade',
      floorCoveringRValue: 0.5,
      designWaterTemp: 110,
      designFloorSurfaceTemp: 80,
    },
  },

  // ─── Zone 2 - Floor 2 Radiators (9 total) ──────────────────────────────────
  // Row 1: Office, Living1, Living2, Kitchen1, Kitchen2
  [IDS.rad2Office]: createRadiator(IDS.rad2Office, '2F Office', X_ZONES, Y_ZONE2_ROW1, 5, 20),
  [IDS.rad2Living1]: createRadiator(IDS.rad2Living1, '2F Living 1', X_ZONES + RAD_SPACING, Y_ZONE2_ROW1, 6, 21),
  [IDS.rad2Living2]: createRadiator(IDS.rad2Living2, '2F Living 2', X_ZONES + RAD_SPACING * 2, Y_ZONE2_ROW1, 6, 22),
  [IDS.rad2Kitchen1]: createRadiator(IDS.rad2Kitchen1, '2F Kitchen 1', X_ZONES + RAD_SPACING * 3, Y_ZONE2_ROW1, 5, 23),
  [IDS.rad2Kitchen2]: createRadiator(IDS.rad2Kitchen2, '2F Kitchen 2', X_ZONES + RAD_SPACING * 4, Y_ZONE2_ROW1, 5, 24),
  // Row 2: Dining1, Dining2, Foyer1, Foyer2
  [IDS.rad2Dining1]: createRadiator(IDS.rad2Dining1, '2F Dining 1', X_ZONES, Y_ZONE2_ROW2, 5, 25),
  [IDS.rad2Dining2]: createRadiator(IDS.rad2Dining2, '2F Dining 2', X_ZONES + RAD_SPACING, Y_ZONE2_ROW2, 5, 26),
  [IDS.rad2Foyer1]: createRadiator(IDS.rad2Foyer1, '2F Foyer 1', X_ZONES + RAD_SPACING * 2, Y_ZONE2_ROW2, 4, 27),
  [IDS.rad2Foyer2]: createRadiator(IDS.rad2Foyer2, '2F Foyer 2', X_ZONES + RAD_SPACING * 3, Y_ZONE2_ROW2, 4, 28),

  // ─── Zone 3 - Floor 3 Radiators (9 total) ──────────────────────────────────
  // Row 1: Bed1, Bed2, Bed3, Bed4, MasterBed1
  [IDS.rad3Bed1]: createRadiator(IDS.rad3Bed1, '3F Bedroom 1', X_ZONES, Y_ZONE3_ROW1, 5, 30),
  [IDS.rad3Bed2]: createRadiator(IDS.rad3Bed2, '3F Bedroom 2', X_ZONES + RAD_SPACING, Y_ZONE3_ROW1, 5, 31),
  [IDS.rad3Bed3]: createRadiator(IDS.rad3Bed3, '3F Bedroom 3', X_ZONES + RAD_SPACING * 2, Y_ZONE3_ROW1, 4, 32),
  [IDS.rad3Bed4]: createRadiator(IDS.rad3Bed4, '3F Bedroom 4', X_ZONES + RAD_SPACING * 3, Y_ZONE3_ROW1, 4, 33),
  [IDS.rad3MasterBed1]: createRadiator(IDS.rad3MasterBed1, '3F Master 1', X_ZONES + RAD_SPACING * 4, Y_ZONE3_ROW1, 6, 34),
  // Row 2: MasterBed2, Office, Bath1, Bath2
  [IDS.rad3MasterBed2]: createRadiator(IDS.rad3MasterBed2, '3F Master 2', X_ZONES, Y_ZONE3_ROW2, 6, 35),
  [IDS.rad3Office]: createRadiator(IDS.rad3Office, '3F Office', X_ZONES + RAD_SPACING, Y_ZONE3_ROW2, 5, 36),
  [IDS.rad3Bath1]: createRadiator(IDS.rad3Bath1, '3F Bath 1', X_ZONES + RAD_SPACING * 2, Y_ZONE3_ROW2, 3, 37),
  [IDS.rad3Bath2]: createRadiator(IDS.rad3Bath2, '3F Bath 2', X_ZONES + RAD_SPACING * 3, Y_ZONE3_ROW2, 3, 38),
};

// ─────────────────────────────────────────────────────────────────────────────
// Pipe Helper Functions
// ─────────────────────────────────────────────────────────────────────────────
function getPortPos(compId: string, portOffsetX: number, portOffsetY: number) {
  const comp = demoComponents[compId];
  return {
    x: comp.position.x + portOffsetX,
    y: comp.position.y + portOffsetY,
  };
}

// Component port offsets
const PORT = {
  boilerSupply: { x: 15, y: 0 },
  boilerReturn: { x: 65, y: 0 },
  pumpInlet: { x: 0, y: 30 },
  pumpOutlet: { x: 60, y: 30 },
  airSepLeft: { x: 0, y: 30 },
  airSepRight: { x: 60, y: 30 },
  expTankConn: { x: 30, y: 60 },
  zoneValveIn: { x: 0, y: 30 },
  zoneValveOut: { x: 60, y: 30 },
  radiantSupply: { x: 10, y: 0 },
  radiantReturn: { x: 70, y: 60 },
  radSupply: { x: 0, y: 30 },
};

// Get radiator return port based on length
function getRadReturnX(lengthFt: number) {
  return lengthFt * 15;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipes - Supply and return piping for all zones
// ─────────────────────────────────────────────────────────────────────────────

// Key positions for routing
const RETURN_HEADER_Y = Y_MECH + 80;        // Below boiler
const TEE_X = X_ZONES - 100;               // Zone tee point

let pipeCounter = 1;
function nextPipeId() {
  return `demo-pipe-${pipeCounter++}`;
}

// Build pipes dynamically
const pipesArray: Pipe[] = [];
const connectionsArray: Connection[] = [];
let connCounter = 1;

// Helper to add pipe and connection
function addPipeAndConnection(
  fromCompId: string,
  fromPortId: string,
  toCompId: string,
  toPortId: string,
  waypoints: { x: number; y: number }[],
  pipeType: 'supply' | 'return',
  material: 'copper' | 'pex' = 'copper',
  size: '1/2' | '3/4' | '1' = '3/4'
) {
  const pipeId = nextPipeId();
  pipesArray.push({
    id: pipeId,
    material,
    size,
    lengthFt: Math.ceil(waypoints.reduce((acc, p, i) => {
      if (i === 0) return 0;
      const prev = waypoints[i - 1];
      return acc + Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y);
    }, 0) / 20),
    pipeType,
    insulation: pipeType === 'supply' ? '0.5' : 'none',
    fittings: { elbows90: Math.max(0, waypoints.length - 2), elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
    waypoints,
    startPortId: `${fromCompId}.${fromPortId}`,
    endPortId: `${toCompId}.${toPortId}`,
  });
  connectionsArray.push({
    id: `demo-conn-${connCounter++}`,
    pipeId,
    fromComponentId: fromCompId,
    fromPortId,
    toComponentId: toCompId,
    toPortId,
  });
}

// ─── Primary Loop Piping ─────────────────────────────────────────────────────

// Boiler supply to pump
const boilerSupplyPos = getPortPos(IDS.boiler, PORT.boilerSupply.x, PORT.boilerSupply.y);
const pumpInletPos = getPortPos(IDS.primaryPump, PORT.pumpInlet.x, PORT.pumpInlet.y);
addPipeAndConnection(IDS.boiler, 'supply', IDS.primaryPump, 'inlet', [
  boilerSupplyPos,
  { x: boilerSupplyPos.x, y: pumpInletPos.y },
  pumpInletPos,
], 'supply', 'copper', '1');

// Pump to air separator
const pumpOutletPos = getPortPos(IDS.primaryPump, PORT.pumpOutlet.x, PORT.pumpOutlet.y);
const airSepLeftPos = getPortPos(IDS.airSeparator, PORT.airSepLeft.x, PORT.airSepLeft.y);
addPipeAndConnection(IDS.primaryPump, 'outlet', IDS.airSeparator, 'left', [
  pumpOutletPos,
  airSepLeftPos,
], 'supply', 'copper', '1');

// Expansion tank connection
const expTankPos = getPortPos(IDS.expansionTank, PORT.expTankConn.x, PORT.expTankConn.y);
addPipeAndConnection(IDS.airSeparator, 'left', IDS.expansionTank, 'connection', [
  { x: expTankPos.x, y: airSepLeftPos.y },
  expTankPos,
], 'supply', 'copper', '3/4');

// ─── Zone 1 (Garage Radiant) Piping ──────────────────────────────────────────

const airSepRightPos = getPortPos(IDS.airSeparator, PORT.airSepRight.x, PORT.airSepRight.y);
const zone1ValveInPos = getPortPos(IDS.zone1Valve, PORT.zoneValveIn.x, PORT.zoneValveIn.y);
const zone1ValveOutPos = getPortPos(IDS.zone1Valve, PORT.zoneValveOut.x, PORT.zoneValveOut.y);
const radiantSupplyPos = getPortPos(IDS.radiantGarage, PORT.radiantSupply.x, PORT.radiantSupply.y);
const radiantReturnPos = getPortPos(IDS.radiantGarage, PORT.radiantReturn.x, PORT.radiantReturn.y);
const boilerReturnPos = getPortPos(IDS.boiler, PORT.boilerReturn.x, PORT.boilerReturn.y);

// Supply header to zone 1 valve
addPipeAndConnection(IDS.airSeparator, 'right', IDS.zone1Valve, 'inlet', [
  airSepRightPos,
  { x: TEE_X, y: airSepRightPos.y },
  { x: TEE_X, y: zone1ValveInPos.y },
  zone1ValveInPos,
], 'supply', 'copper', '3/4');

// Zone 1 valve to radiant
addPipeAndConnection(IDS.zone1Valve, 'outlet', IDS.radiantGarage, 'supply', [
  zone1ValveOutPos,
  { x: radiantSupplyPos.x, y: zone1ValveOutPos.y },
  radiantSupplyPos,
], 'supply', 'pex', '1/2');

// Radiant return to boiler
addPipeAndConnection(IDS.radiantGarage, 'return', IDS.boiler, 'return', [
  radiantReturnPos,
  { x: radiantReturnPos.x, y: Y_ZONE1 + 100 },
  { x: boilerReturnPos.x, y: Y_ZONE1 + 100 },
  boilerReturnPos,
], 'return', 'pex', '1/2');

// ─── Zone 2 (Floor 2) Piping - Parallel radiators ────────────────────────────

const zone2ValveInPos = getPortPos(IDS.zone2Valve, PORT.zoneValveIn.x, PORT.zoneValveIn.y);
const zone2ValveOutPos = getPortPos(IDS.zone2Valve, PORT.zoneValveOut.x, PORT.zoneValveOut.y);

// Supply to zone 2 valve
addPipeAndConnection(IDS.airSeparator, 'right', IDS.zone2Valve, 'inlet', [
  { x: TEE_X, y: airSepRightPos.y },
  { x: TEE_X, y: zone2ValveInPos.y },
  zone2ValveInPos,
], 'supply', 'copper', '1');

// Zone 2 headers
const zone2SupplyHeaderY = Y_ZONE2_ROW1 - 20;
const zone2ReturnHeaderY = Y_ZONE2_ROW2 + 80;

// Zone 2 Row 1 radiators
const zone2Row1Rads = [IDS.rad2Office, IDS.rad2Living1, IDS.rad2Living2, IDS.rad2Kitchen1, IDS.rad2Kitchen2];
const zone2Row1Lengths = [5, 6, 6, 5, 5];

// Connect zone valve to supply header
const firstRad2Pos = getPortPos(zone2Row1Rads[0], PORT.radSupply.x, PORT.radSupply.y);
addPipeAndConnection(IDS.zone2Valve, 'outlet', zone2Row1Rads[0], 'supply', [
  zone2ValveOutPos,
  { x: zone2ValveOutPos.x + 20, y: zone2ValveOutPos.y },
  { x: zone2ValveOutPos.x + 20, y: zone2SupplyHeaderY },
  { x: firstRad2Pos.x, y: zone2SupplyHeaderY },
  firstRad2Pos,
], 'supply');

// Connect row 1 radiators via supply header
for (let i = 1; i < zone2Row1Rads.length; i++) {
  const radId = zone2Row1Rads[i];
  const prevRadPos = getPortPos(zone2Row1Rads[i-1], PORT.radSupply.x, PORT.radSupply.y);
  const radSupplyPos = getPortPos(radId, PORT.radSupply.x, PORT.radSupply.y);
  addPipeAndConnection(zone2Row1Rads[i-1], 'supply', radId, 'supply', [
    { x: prevRadPos.x, y: zone2SupplyHeaderY },
    { x: radSupplyPos.x, y: zone2SupplyHeaderY },
    radSupplyPos,
  ], 'supply');
}

// Zone 2 Row 2 radiators
const zone2Row2Rads = [IDS.rad2Dining1, IDS.rad2Dining2, IDS.rad2Foyer1, IDS.rad2Foyer2];
const zone2Row2Lengths = [5, 5, 4, 4];

for (let i = 0; i < zone2Row2Rads.length; i++) {
  const radId = zone2Row2Rads[i];
  const radSupplyPos = getPortPos(radId, PORT.radSupply.x, PORT.radSupply.y);
  const sourceRad = zone2Row1Rads[Math.min(i, zone2Row1Rads.length - 1)];
  addPipeAndConnection(sourceRad, 'supply', radId, 'supply', [
    { x: radSupplyPos.x, y: zone2SupplyHeaderY },
    radSupplyPos,
  ], 'supply');
}

// Return piping for Zone 2 - connect all returns to a shared return header
const allZone2Rads = [...zone2Row1Rads, ...zone2Row2Rads];
const allZone2Lengths = [...zone2Row1Lengths, ...zone2Row2Lengths];

// First create connections from each radiator return to the return header
for (let i = 0; i < allZone2Rads.length; i++) {
  const radId = allZone2Rads[i];
  const length = allZone2Lengths[i];
  const radReturnPos = getPortPos(radId, getRadReturnX(length), PORT.radSupply.y);
  
  if (i === 0) {
    // First radiator's return carries combined flow back to boiler
    addPipeAndConnection(radId, 'return', IDS.boiler, 'return', [
      radReturnPos,
      { x: radReturnPos.x + 30, y: radReturnPos.y },
      { x: radReturnPos.x + 30, y: zone2ReturnHeaderY },
      { x: boilerReturnPos.x, y: zone2ReturnHeaderY },
      { x: boilerReturnPos.x, y: RETURN_HEADER_Y },
      boilerReturnPos,
    ], 'return');
  } else {
    // Other radiators connect to the return header horizontally then merge
    const firstReturnX = getPortPos(allZone2Rads[0], getRadReturnX(allZone2Lengths[0]), PORT.radSupply.y).x + 30;
    addPipeAndConnection(radId, 'return', allZone2Rads[0], 'return', [
      radReturnPos,
      { x: radReturnPos.x + 30, y: radReturnPos.y },
      { x: radReturnPos.x + 30, y: zone2ReturnHeaderY },
      { x: firstReturnX, y: zone2ReturnHeaderY },
    ], 'return');
  }
}

// ─── Zone 3 (Floor 3) Piping - Parallel radiators ────────────────────────────

const zone3ValveInPos = getPortPos(IDS.zone3Valve, PORT.zoneValveIn.x, PORT.zoneValveIn.y);
const zone3ValveOutPos = getPortPos(IDS.zone3Valve, PORT.zoneValveOut.x, PORT.zoneValveOut.y);

// Supply to zone 3 valve
addPipeAndConnection(IDS.airSeparator, 'right', IDS.zone3Valve, 'inlet', [
  { x: TEE_X, y: airSepRightPos.y },
  { x: TEE_X, y: zone3ValveInPos.y },
  zone3ValveInPos,
], 'supply', 'copper', '1');

// Zone 3 headers
const zone3SupplyHeaderY = Y_ZONE3_ROW1 - 20;
const zone3ReturnHeaderY = Y_ZONE3_ROW2 + 80;

// Zone 3 Row 1 radiators
const zone3Row1Rads = [IDS.rad3Bed1, IDS.rad3Bed2, IDS.rad3Bed3, IDS.rad3Bed4, IDS.rad3MasterBed1];
const zone3Row1Lengths = [5, 5, 4, 4, 6];

// Connect zone valve to first radiator
const firstRad3Pos = getPortPos(zone3Row1Rads[0], PORT.radSupply.x, PORT.radSupply.y);
addPipeAndConnection(IDS.zone3Valve, 'outlet', zone3Row1Rads[0], 'supply', [
  zone3ValveOutPos,
  { x: zone3ValveOutPos.x + 20, y: zone3ValveOutPos.y },
  { x: zone3ValveOutPos.x + 20, y: zone3SupplyHeaderY },
  { x: firstRad3Pos.x, y: zone3SupplyHeaderY },
  firstRad3Pos,
], 'supply');

// Connect row 1 radiators
for (let i = 1; i < zone3Row1Rads.length; i++) {
  const radId = zone3Row1Rads[i];
  const prevRadPos = getPortPos(zone3Row1Rads[i-1], PORT.radSupply.x, PORT.radSupply.y);
  const radSupplyPos = getPortPos(radId, PORT.radSupply.x, PORT.radSupply.y);
  addPipeAndConnection(zone3Row1Rads[i-1], 'supply', radId, 'supply', [
    { x: prevRadPos.x, y: zone3SupplyHeaderY },
    { x: radSupplyPos.x, y: zone3SupplyHeaderY },
    radSupplyPos,
  ], 'supply');
}

// Zone 3 Row 2 radiators
const zone3Row2Rads = [IDS.rad3MasterBed2, IDS.rad3Office, IDS.rad3Bath1, IDS.rad3Bath2];
const zone3Row2Lengths = [6, 5, 3, 3];

for (let i = 0; i < zone3Row2Rads.length; i++) {
  const radId = zone3Row2Rads[i];
  const radSupplyPos = getPortPos(radId, PORT.radSupply.x, PORT.radSupply.y);
  const sourceRad = zone3Row1Rads[Math.min(i, zone3Row1Rads.length - 1)];
  addPipeAndConnection(sourceRad, 'supply', radId, 'supply', [
    { x: radSupplyPos.x, y: zone3SupplyHeaderY },
    radSupplyPos,
  ], 'supply');
}

// Return piping for Zone 3 - connect all returns to a shared return header
const allZone3Rads = [...zone3Row1Rads, ...zone3Row2Rads];
const allZone3Lengths = [...zone3Row1Lengths, ...zone3Row2Lengths];

for (let i = 0; i < allZone3Rads.length; i++) {
  const radId = allZone3Rads[i];
  const length = allZone3Lengths[i];
  const radReturnPos = getPortPos(radId, getRadReturnX(length), PORT.radSupply.y);
  
  if (i === 0) {
    // First radiator's return carries combined flow back to boiler
    addPipeAndConnection(radId, 'return', IDS.boiler, 'return', [
      radReturnPos,
      { x: radReturnPos.x + 30, y: radReturnPos.y },
      { x: radReturnPos.x + 30, y: zone3ReturnHeaderY },
      { x: boilerReturnPos.x, y: zone3ReturnHeaderY },
      { x: boilerReturnPos.x, y: RETURN_HEADER_Y },
      boilerReturnPos,
    ], 'return');
  } else {
    // Other radiators connect to the return header horizontally then merge
    const firstReturnX = getPortPos(allZone3Rads[0], getRadReturnX(allZone3Lengths[0]), PORT.radSupply.y).x + 30;
    addPipeAndConnection(radId, 'return', allZone3Rads[0], 'return', [
      radReturnPos,
      { x: radReturnPos.x + 30, y: radReturnPos.y },
      { x: radReturnPos.x + 30, y: zone3ReturnHeaderY },
      { x: firstReturnX, y: zone3ReturnHeaderY },
    ], 'return');
  }
}

// Export pipes as record
export const demoPipes: Record<string, Pipe> = {};
for (const pipe of pipesArray) {
  demoPipes[pipe.id] = pipe;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connections
// ─────────────────────────────────────────────────────────────────────────────
export const demoConnections: Connection[] = connectionsArray;

// ─────────────────────────────────────────────────────────────────────────────
// Simulation State - start running to wow the user
// ─────────────────────────────────────────────────────────────────────────────
export const demoSimulationState: SimulationState = {
  settings: {
    running: true,
    paused: false,
    timeScale: 1,
    outdoorTemp: 20,
    elapsedSeconds: 0,
  },
  componentStates: {
    [IDS.boiler]: {
      supplyTemp: 165,
      returnTemp: 140,
      flowGpm: 18,
      status: 'firing',
    },
    [IDS.primaryPump]: {
      supplyTemp: 165,
      returnTemp: 140,
      flowGpm: 18,
      status: 'running',
    },
    [IDS.zone1Valve]: {
      supplyTemp: 110,
      returnTemp: 95,
      flowGpm: 3,
      status: 'running',
    },
    [IDS.zone2Valve]: {
      supplyTemp: 160,
      returnTemp: 140,
      flowGpm: 8,
      status: 'running',
    },
    [IDS.zone3Valve]: {
      supplyTemp: 160,
      returnTemp: 140,
      flowGpm: 7,
      status: 'running',
    },
    [IDS.radiantGarage]: {
      supplyTemp: 110,
      returnTemp: 95,
      flowGpm: 3,
      status: 'running',
    },
    // Zone 2 radiators
    [IDS.rad2Office]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad2Living1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.9, status: 'running' },
    [IDS.rad2Living2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.9, status: 'running' },
    [IDS.rad2Kitchen1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad2Kitchen2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad2Dining1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad2Dining2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad2Foyer1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.5, status: 'running' },
    [IDS.rad2Foyer2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.5, status: 'running' },
    // Zone 3 radiators
    [IDS.rad3Bed1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad3Bed2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad3Bed3]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.6, status: 'running' },
    [IDS.rad3Bed4]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.6, status: 'running' },
    [IDS.rad3MasterBed1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.9, status: 'running' },
    [IDS.rad3MasterBed2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.9, status: 'running' },
    [IDS.rad3Office]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.7, status: 'running' },
    [IDS.rad3Bath1]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.4, status: 'running' },
    [IDS.rad3Bath2]: { supplyTemp: 160, returnTemp: 145, flowGpm: 0.4, status: 'running' },
  },
};
