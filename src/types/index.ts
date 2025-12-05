// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the Hydronic System Designer
// ─────────────────────────────────────────────────────────────────────────────

/** Climate / location settings */
export interface ClimateConfig {
  designOutdoorTemp: number; // °F, e.g. -10
  indoorDesignTemp: number; // °F, default 70
  heatingDegreeDays: number; // HDD
  climateZone: number; // 1-8
}

/** Building envelope R-values */
export interface InsulationValues {
  walls: number;
  ceiling: number;
  floor: number;
  basementWalls: number;
}

/** Window / door info */
export interface WindowDoorConfig {
  totalWindowArea: number; // sq ft
  windowUValue: number; // BTU/(hr·ft²·°F)
  exteriorDoorCount: number;
  doorUValue: number;
  doorArea: number; // sq ft per door
}

/** Infiltration settings */
export interface InfiltrationConfig {
  ach: number; // air changes per hour
  blowerDoorCFM50: number | null;
}

export type FoundationType = 'slab' | 'crawlspace' | 'basement';
export type ConstructionEra = 'pre-1950' | '1950-1980' | '1980-2000' | '2000+' | 'custom';

/** Building configuration for heat-loss calculation */
export interface BuildingConfig {
  climate: ClimateConfig;
  totalSqFt: number;
  floors: number;
  ceilingHeight: number; // ft
  foundationType: FoundationType;
  constructionEra: ConstructionEra;
  insulation: InsulationValues;
  windowDoor: WindowDoorConfig;
  infiltration: InfiltrationConfig;
}

/** Heating zone definition */
export interface Zone {
  id: string;
  name: string;
  sqFt: number;
  heatLossOverride: number | null; // BTU/hr manual override
  designWaterTemp: number; // °F
  emitterType: EmitterType | null;
  priority: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Types
// ─────────────────────────────────────────────────────────────────────────────

export type EmitterType =
  | 'baseboard'
  | 'panel_radiator'
  | 'cast_iron_radiator'
  | 'radiant_floor'
  | 'fan_coil'
  | 'towel_warmer';

export type ComponentType =
  | 'boiler_gas'
  | 'boiler_oil'
  | 'boiler_electric'
  | 'heat_pump_a2w'
  | 'indirect_water_heater'
  | 'pump_fixed'
  | 'pump_variable'
  | 'zone_pump'
  | 'zone_valve_2way'
  | 'zone_valve_3way'
  | 'mixing_valve'
  | 'balancing_valve'
  | 'check_valve'
  | 'ball_valve'
  | 'trv'
  | 'baseboard'
  | 'panel_radiator'
  | 'cast_iron_radiator'
  | 'radiant_floor'
  | 'fan_coil'
  | 'towel_warmer'
  | 'expansion_tank'
  | 'buffer_tank'
  | 'air_separator'
  | 'hydraulic_separator'
  | 'manifold'
  | 'pressure_relief'
  | 'fill_valve'
  | 'air_vent'
  | 'thermostat'
  | 'outdoor_reset'
  | 'aquastat';

export type PortType = 'supply' | 'return' | 'general';

export interface Port {
  id: string;
  type: PortType;
  /** Position relative to component origin */
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

/** Base for all placeable components */
export interface BaseComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: Position;
  rotation: number; // degrees, 0/90/180/270
  flippedH: boolean;
  flippedV: boolean;
  ports: Port[];
  zIndex: number;
}

// ─── Heat Sources ────────────────────────────────────────────────────────────

export interface BoilerGasProps {
  fuelType: 'natural_gas' | 'propane';
  inputBtu: number;
  afue: number; // 0-1
  boilerType: 'conventional' | 'condensing';
  minFiringRate: number; // 0-1
  maxSupplyTemp: number;
  minReturnTemp: number;
  pressureDrop: number; // ft head
  connectionSize: string;
  electricalWatts: number;
  controlType: 'on_off' | 'modulating' | 'outdoor_reset';
}

export interface BoilerGasComponent extends BaseComponent {
  type: 'boiler_gas';
  props: BoilerGasProps;
}

export interface BoilerElectricProps {
  kwRating: number;
  stages: number;
  voltage: 208 | 240 | 480;
}

export interface BoilerElectricComponent extends BaseComponent {
  type: 'boiler_electric';
  props: BoilerElectricProps;
}

// ─── Pumps ───────────────────────────────────────────────────────────────────

export interface PumpCurvePoint {
  gpm: number;
  head: number; // ft
}

export interface PumpProps {
  pumpType: 'fixed' | '3speed' | 'variable_ecm';
  curve: PumpCurvePoint[];
  maxGpm: number;
  maxHead: number;
  watts: number;
  connectionSize: string;
  location: 'supply' | 'return';
  control: 'always_on' | 'thermostat' | 'delta_t' | 'delta_p';
  speedSetting: 'low' | 'med' | 'high' | null;
}

export interface PumpComponent extends BaseComponent {
  type: 'pump_fixed' | 'pump_variable' | 'zone_pump';
  props: PumpProps;
}

// ─── Valves ──────────────────────────────────────────────────────────────────

export interface ZoneValveProps {
  valveType: '2way' | '3way';
  size: string;
  cv: number;
  actuatorType: 'thermal' | 'motor' | 'spring_return';
  normallyOpen: boolean;
  hasEndSwitch: boolean;
  voltage: 24 | 120 | 240;
  pressureDrop: number;
}

export interface ZoneValveComponent extends BaseComponent {
  type: 'zone_valve_2way' | 'zone_valve_3way';
  props: ZoneValveProps;
}

export interface MixingValveProps {
  valveType: '3way' | '4way';
  size: string;
  cv: number;
  controlType: 'thermostatic' | 'motorized_outdoor_reset';
  mixedTempSetpoint: number;
  actuatorSpeed: number; // sec/90°
  outdoorResetCurve: { outdoorTemp: number; supplyTemp: number }[];
}

export interface MixingValveComponent extends BaseComponent {
  type: 'mixing_valve';
  props: MixingValveProps;
}

// ─── Emitters ────────────────────────────────────────────────────────────────

export interface BaseboardProps {
  lengthFt: number;
  elementType: 'residential' | 'commercial';
  btuPerFtAt180: number;
  btuPerFtAt160: number;
  btuPerFtAt140: number;
  enclosureType: 'standard' | 'high_output';
  connectionEnd: 'same' | 'opposite';
}

export interface BaseboardComponent extends BaseComponent {
  type: 'baseboard';
  props: BaseboardProps;
}

export interface RadiantFloorProps {
  zoneArea: number;
  tubingType: 'pex' | 'pex_al_pex' | 'pert';
  tubingSize: '3/8' | '1/2' | '5/8';
  loopSpacing: 6 | 8 | 9 | 12;
  loopCount: number;
  loopLength: number;
  installationType: 'slab_on_grade' | 'thin_slab' | 'staple_up' | 'plates';
  floorCoveringRValue: number;
  designWaterTemp: number;
  designFloorSurfaceTemp: number;
}

export interface RadiantFloorComponent extends BaseComponent {
  type: 'radiant_floor';
  props: RadiantFloorProps;
}

// ─── System Components ───────────────────────────────────────────────────────

export interface ExpansionTankProps {
  tankType: 'diaphragm' | 'bladder';
  volumeGal: number;
  acceptanceVolumeGal: number;
  preChargePsi: number;
  maxWorkingPsi: number;
  connectionSize: string;
}

export interface ExpansionTankComponent extends BaseComponent {
  type: 'expansion_tank';
  props: ExpansionTankProps;
}

export interface AirSeparatorProps {
  separatorType: 'standard' | 'microbubble';
  size: string;
  maxGpm: number;
  pressureDrop: number;
}

export interface AirSeparatorComponent extends BaseComponent {
  type: 'air_separator';
  props: AirSeparatorProps;
}

// ─── Generic component union (extend as needed) ──────────────────────────────

export type HydronicComponent =
  | BoilerGasComponent
  | BoilerElectricComponent
  | PumpComponent
  | ZoneValveComponent
  | MixingValveComponent
  | BaseboardComponent
  | RadiantFloorComponent
  | ExpansionTankComponent
  | AirSeparatorComponent
  | GenericComponent;

/** Fallback for components not yet fully typed */
export interface GenericComponent extends BaseComponent {
  props: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Piping
// ─────────────────────────────────────────────────────────────────────────────

export type PipeMaterial = 'copper' | 'pex' | 'pex_al_pex' | 'black_steel' | 'cpvc';
export type PipeSize = '1/2' | '3/4' | '1' | '1-1/4' | '1-1/2' | '2';

export interface PipeFittings {
  elbows90: number;
  elbows45: number;
  teesThrough: number;
  teesBranch: number;
  couplings: number;
}

export interface Pipe {
  id: string;
  material: PipeMaterial;
  size: PipeSize;
  lengthFt: number;
  pipeType: 'supply' | 'return';
  insulation: 'none' | '0.5' | '0.75' | '1';
  fittings: PipeFittings;
  /** SVG path waypoints */
  waypoints: Position[];
  startPortId: string | null; // componentId.portId
  endPortId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connections
// ─────────────────────────────────────────────────────────────────────────────

export interface Connection {
  id: string;
  pipeId: string;
  fromComponentId: string;
  fromPortId: string;
  toComponentId: string;
  toPortId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation State
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulationSettings {
  running: boolean;
  paused: boolean;
  timeScale: 1 | 10 | 60 | 3600;
  outdoorTemp: number;
  elapsedSeconds: number;
}

export interface ComponentSimState {
  supplyTemp: number;
  returnTemp: number;
  flowGpm: number;
  status: 'off' | 'running' | 'firing' | 'call';
}

export interface SimulationState {
  settings: SimulationSettings;
  componentStates: Record<string, ComponentSimState>;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI State
// ─────────────────────────────────────────────────────────────────────────────

export type Tool = 'select' | 'pan' | 'pipe' | 'delete';

/** State for an in-progress pipe connection */
export interface PendingConnection {
  fromComponentId: string;
  fromPortId: string;
  fromPosition: Position;
  currentMousePosition: Position;
}

export interface UIState {
  tool: Tool;
  selectedIds: string[];
  zoom: number;
  panOffset: Position;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  pendingConnection: PendingConnection | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level System State
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemState {
  building: BuildingConfig;
  zones: Zone[];
  components: Record<string, HydronicComponent>;
  pipes: Record<string, Pipe>;
  connections: Connection[];
  simulation: SimulationState;
  ui: UIState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationMessage {
  id: string;
  severity: ValidationSeverity;
  message: string;
  componentId?: string;
  pipeId?: string;
}
