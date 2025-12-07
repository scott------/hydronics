// ─────────────────────────────────────────────────────────────────────────────
// Thermal Simulation Engine for Hydronic System
// Pure functions that compute component states from system configuration
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BuildingConfig,
  Zone,
  HydronicComponent,
  Connection,
  ComponentSimState,
  BoilerGasComponent,
} from '../types';
import { calculateHeatLoss, allocateZoneHeatLoss, requiredGPM } from './heatLoss';
import { buildComponentZoneMap } from './autoLayout';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ZoneDemand {
  zoneId: string;
  zoneName: string;
  sqFt: number;
  designHeatLoss: number;     // BTU/hr at design conditions
  currentHeatLoss: number;    // BTU/hr at current outdoor temp
  isCalling: boolean;         // Zone thermostat is calling for heat
  zoneValveId: string | null; // ID of zone valve controlling this zone
  designWaterTemp: number;    // Target supply water temp for zone
  emitterType: string | null;
}

export interface BoilerState {
  firingRate: number;       // 0-1 (0 = off, 1 = max fire)
  outputBtu: number;        // Current BTU/hr output
  supplyTemp: number;       // Supply water temperature
  returnTemp: number;       // Return water temperature
  flowGpm: number;          // Flow through boiler
  status: 'off' | 'running' | 'firing';
}

export interface ZoneFlow {
  zoneId: string;
  flowGpm: number;
  supplyTemp: number;
  returnTemp: number;
  btuDelivered: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Heat Loss Scaling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scale design heat loss based on current outdoor temperature
 * actualLoss = designLoss × (indoorTemp - outdoorTemp) / (indoorTemp - designOutdoorTemp)
 */
export function scaleHeatLossToOutdoorTemp(
  designLoss: number,
  indoorTemp: number,
  outdoorTemp: number,
  designOutdoorTemp: number
): number {
  const designDeltaT = indoorTemp - designOutdoorTemp;
  if (designDeltaT <= 0) return 0;

  const currentDeltaT = indoorTemp - outdoorTemp;
  if (currentDeltaT <= 0) return 0; // No heating needed when outdoor >= indoor

  return designLoss * (currentDeltaT / designDeltaT);
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Demand Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate heating demand for each zone
 * In MVP, all zones call for heat when outdoor < indoor (simplified)
 */
export function calculateZoneDemands(
  building: BuildingConfig,
  zones: Zone[],
  components: Record<string, HydronicComponent>,
  connections: Connection[],
  outdoorTemp: number
): ZoneDemand[] {
  if (zones.length === 0) return [];

  // 1. Calculate total building heat loss at design conditions
  const designHeatLoss = calculateHeatLoss(building);

  // 2. Allocate to zones proportionally
  const zoneAllocations = allocateZoneHeatLoss(
    designHeatLoss.total,
    building.totalSqFt,
    zones
  );

  // 3. Build component-zone map to find zone valves
  const componentZoneMap = buildComponentZoneMap(components, connections, zones);

  // 4. Find zone valve for each zone
  const zoneToValve = new Map<string, string>();
  for (const [compId, zoneId] of componentZoneMap) {
    const comp = components[compId];
    if (comp?.type === 'zone_valve_2way' || comp?.type === 'zone_valve_3way') {
      zoneToValve.set(zoneId, compId);
    }
  }

  // 5. Calculate demand for each zone
  const demands: ZoneDemand[] = [];
  for (const zone of zones) {
    const designLoss = zoneAllocations.get(zone.id) || 0;
    const currentLoss = scaleHeatLossToOutdoorTemp(
      designLoss,
      building.climate.indoorDesignTemp,
      outdoorTemp,
      building.climate.designOutdoorTemp
    );

    // Simplified: zone calls for heat when currentLoss > 0
    const isCalling = currentLoss > 0;

    demands.push({
      zoneId: zone.id,
      zoneName: zone.name,
      sqFt: zone.sqFt,
      designHeatLoss: designLoss,
      currentHeatLoss: currentLoss,
      isCalling,
      zoneValveId: zoneToValve.get(zone.id) || null,
      designWaterTemp: zone.designWaterTemp,
      emitterType: zone.emitterType,
    });
  }

  return demands;
}

// ─────────────────────────────────────────────────────────────────────────────
// Boiler State Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate boiler operating state based on system demand
 */
export function calculateBoilerState(
  boilerComp: BoilerGasComponent,
  totalDemandBtu: number,
  anyZoneCalling: boolean
): BoilerState {
  const props = boilerComp.props;
  const maxOutputBtu = props.inputBtu * props.afue;

  if (!anyZoneCalling || totalDemandBtu <= 0) {
    return {
      firingRate: 0,
      outputBtu: 0,
      supplyTemp: 70, // Ambient when off
      returnTemp: 70,
      flowGpm: 0,
      status: 'off',
    };
  }

  // Calculate required firing rate
  let firingRate = totalDemandBtu / maxOutputBtu;

  // Clamp to boiler's modulation range
  if (firingRate < props.minFiringRate) {
    // Below min firing - would cycle on/off in reality, simplify to min fire
    firingRate = props.minFiringRate;
  } else if (firingRate > 1) {
    firingRate = 1; // Can't exceed 100%
  }

  const outputBtu = maxOutputBtu * firingRate;

  // Calculate temperatures
  // Supply temp increases with firing rate (modulating boiler behavior)
  const baseSupplyTemp = 140; // Low fire temp
  const maxSupplyTemp = Math.min(props.maxSupplyTemp, 180);
  const supplyTemp = baseSupplyTemp + (maxSupplyTemp - baseSupplyTemp) * firingRate;

  // Standard 20F delta-T for sizing
  const deltaT = 20;
  const returnTemp = supplyTemp - deltaT;

  // Calculate flow: GPM = BTU / (500 × ΔT)
  const flowGpm = requiredGPM(outputBtu, deltaT);

  return {
    firingRate,
    outputBtu,
    supplyTemp: Math.round(supplyTemp),
    returnTemp: Math.round(returnTemp),
    flowGpm: Math.round(flowGpm * 10) / 10,
    status: 'firing',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Flow Distribution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate flow distribution to active zones
 */
export function calculateZoneFlows(
  zoneDemands: ZoneDemand[],
  boilerState: BoilerState
): ZoneFlow[] {
  // Get active zones
  const activeZones = zoneDemands.filter(z => z.isCalling);
  if (activeZones.length === 0 || boilerState.flowGpm <= 0) {
    return zoneDemands.map(z => ({
      zoneId: z.zoneId,
      flowGpm: 0,
      supplyTemp: 70,
      returnTemp: 70,
      btuDelivered: 0,
    }));
  }

  // Calculate total demand for proportional distribution
  const totalDemand = activeZones.reduce((sum, z) => sum + z.currentHeatLoss, 0);

  return zoneDemands.map(zone => {
    if (!zone.isCalling || totalDemand <= 0) {
      return {
        zoneId: zone.zoneId,
        flowGpm: 0,
        supplyTemp: 70,
        returnTemp: 70,
        btuDelivered: 0,
      };
    }

    // Proportional flow based on demand
    const demandRatio = zone.currentHeatLoss / totalDemand;
    const flowGpm = boilerState.flowGpm * demandRatio;

    // Supply temp may be mixed down for radiant zones
    let supplyTemp = boilerState.supplyTemp;
    if (zone.emitterType === 'radiant_floor') {
      // Mix down to safe radiant temps (max 120F to protect flooring)
      supplyTemp = Math.min(zone.designWaterTemp, 120);
    }

    // Calculate return temp based on heat delivered
    // deltaT = BTU / (500 × GPM)
    const deltaT = flowGpm > 0 ? zone.currentHeatLoss / (500 * flowGpm) : 0;
    const returnTemp = supplyTemp - Math.min(deltaT, 30); // Cap delta-T at 30F

    return {
      zoneId: zone.zoneId,
      flowGpm: Math.round(flowGpm * 10) / 10,
      supplyTemp: Math.round(supplyTemp),
      returnTemp: Math.round(returnTemp),
      btuDelivered: zone.currentHeatLoss,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Emitter State Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate emitter operating state
 */
export function calculateEmitterState(
  zoneFlow: ZoneFlow | null,
  emittersInZone: number // Number of emitters sharing the zone flow
): ComponentSimState {
  if (!zoneFlow || zoneFlow.flowGpm <= 0) {
    return {
      supplyTemp: 70,
      returnTemp: 70,
      flowGpm: 0,
      status: 'off',
    };
  }

  // Distribute zone flow among emitters (simplified equal distribution)
  const flowGpm = zoneFlow.flowGpm / Math.max(1, emittersInZone);

  return {
    supplyTemp: zoneFlow.supplyTemp,
    returnTemp: zoneFlow.returnTemp,
    flowGpm: Math.round(flowGpm * 10) / 10,
    status: 'running',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Simulation Tick
// ─────────────────────────────────────────────────────────────────────────────

const EMITTER_TYPES = new Set([
  'baseboard', 'panel_radiator', 'cast_iron_radiator',
  'radiant_floor', 'fan_coil', 'towel_warmer'
]);

const BOILER_TYPES = new Set(['boiler_gas', 'boiler_oil', 'boiler_electric']);

const PUMP_TYPES = new Set(['pump_fixed', 'pump_variable', 'zone_pump']);

const VALVE_TYPES = new Set(['zone_valve_2way', 'zone_valve_3way']);

/**
 * Main simulation tick - calculates all component states
 * Designed to be called every animation frame (60fps)
 */
export function runSimulationTick(
  building: BuildingConfig,
  zones: Zone[],
  components: Record<string, HydronicComponent>,
  connections: Connection[],
  outdoorTemp: number
): Record<string, ComponentSimState> {
  const componentStates: Record<string, ComponentSimState> = {};

  // Default state for all components
  const offState: ComponentSimState = {
    supplyTemp: 70,
    returnTemp: 70,
    flowGpm: 0,
    status: 'off',
  };

  // Initialize all components to off
  for (const id of Object.keys(components)) {
    componentStates[id] = { ...offState };
  }

  // 1. Find the boiler
  const boilerEntry = Object.entries(components).find(
    ([_, c]) => BOILER_TYPES.has(c.type)
  );

  if (!boilerEntry) {
    // No boiler - all components stay off
    return componentStates;
  }

  const [boilerId, boilerComp] = boilerEntry;

  // 2. Calculate zone demands
  const zoneDemands = calculateZoneDemands(building, zones, components, connections, outdoorTemp);
  const totalDemand = zoneDemands.reduce((sum, z) => sum + z.currentHeatLoss, 0);
  const anyZoneCalling = zoneDemands.some(z => z.isCalling);

  // 3. Calculate boiler state
  const boilerState = calculateBoilerState(
    boilerComp as BoilerGasComponent,
    totalDemand,
    anyZoneCalling
  );

  componentStates[boilerId] = {
    supplyTemp: boilerState.supplyTemp,
    returnTemp: boilerState.returnTemp,
    flowGpm: boilerState.flowGpm,
    status: boilerState.status,
  };

  // 4. Calculate zone flows
  const zoneFlows = calculateZoneFlows(zoneDemands, boilerState);
  const zoneFlowMap = new Map(zoneFlows.map(zf => [zf.zoneId, zf]));

  // 5. Build component-zone mapping
  const componentZoneMap = buildComponentZoneMap(components, connections, zones);

  // 6. Count emitters per zone for flow distribution
  const emittersPerZone = new Map<string, number>();
  for (const [compId, zoneId] of componentZoneMap) {
    const comp = components[compId];
    if (EMITTER_TYPES.has(comp.type)) {
      emittersPerZone.set(zoneId, (emittersPerZone.get(zoneId) || 0) + 1);
    }
  }

  // 7. Build zone demand map for valve status
  const zoneDemandMap = new Map(zoneDemands.map(zd => [zd.zoneId, zd]));

  // 8. Calculate state for all components
  for (const [compId, comp] of Object.entries(components)) {
    if (compId === boilerId) continue; // Already handled

    const zoneId = componentZoneMap.get(compId);
    const zoneFlow = zoneId ? zoneFlowMap.get(zoneId) : null;
    const zoneDemand = zoneId ? zoneDemandMap.get(zoneId) : null;

    if (PUMP_TYPES.has(comp.type)) {
      // Pumps run when any zone calls
      componentStates[compId] = {
        supplyTemp: boilerState.supplyTemp,
        returnTemp: boilerState.returnTemp,
        flowGpm: boilerState.flowGpm,
        status: anyZoneCalling ? 'running' : 'off',
      };
    } else if (VALVE_TYPES.has(comp.type)) {
      // Zone valves open when their zone calls
      const isValveOpen = zoneDemand?.isCalling || false;
      componentStates[compId] = {
        supplyTemp: zoneFlow?.supplyTemp || 70,
        returnTemp: zoneFlow?.returnTemp || 70,
        flowGpm: zoneFlow?.flowGpm || 0,
        status: isValveOpen ? 'running' : 'off',
      };
    } else if (EMITTER_TYPES.has(comp.type)) {
      // Emitters get proportional flow
      const emitterCount = emittersPerZone.get(zoneId || '') || 1;
      componentStates[compId] = calculateEmitterState(zoneFlow || null, emitterCount);
    } else if (comp.type === 'air_separator' || comp.type === 'expansion_tank') {
      // Passive components show system state when running
      componentStates[compId] = {
        supplyTemp: boilerState.supplyTemp,
        returnTemp: boilerState.returnTemp,
        flowGpm: 0,
        status: anyZoneCalling ? 'running' : 'off',
      };
    }
    // Other components stay at default (off)
  }

  return componentStates;
}
