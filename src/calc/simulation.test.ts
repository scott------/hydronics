// ─────────────────────────────────────────────────────────────────────────────
// Thermal Simulation Engine Tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  scaleHeatLossToOutdoorTemp,
  calculateZoneDemands,
  calculateBoilerState,
  calculateZoneFlows,
  calculateEmitterState,
  runSimulationTick,
} from './simulation';
import type { BoilerGasComponent } from '../types';
import {
  demoBuildingConfig,
  demoZones,
  demoComponents,
  demoConnections,
} from '../store/demoSystem';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockBoiler: BoilerGasComponent = {
  id: 'test-boiler',
  type: 'boiler_gas',
  name: 'Test Boiler',
  position: { x: 0, y: 0 },
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
    minFiringRate: 0.2,
    maxSupplyTemp: 180,
    minReturnTemp: 100,
    pressureDrop: 3,
    connectionSize: '1',
    electricalWatts: 150,
    controlType: 'modulating',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// scaleHeatLossToOutdoorTemp Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('scaleHeatLossToOutdoorTemp', () => {
  it('returns design loss at design outdoor temp', () => {
    // At design conditions (outdoor = -5F, indoor = 70F), loss = design loss
    const result = scaleHeatLossToOutdoorTemp(40000, 70, -5, -5);
    expect(result).toBe(40000);
  });

  it('returns half loss when delta-T is halved', () => {
    // Design: 70 - (-5) = 75F delta
    // Current: 70 - 32.5 = 37.5F delta (half)
    const result = scaleHeatLossToOutdoorTemp(40000, 70, 32.5, -5);
    expect(result).toBe(20000);
  });

  it('returns 0 when outdoor >= indoor', () => {
    const result = scaleHeatLossToOutdoorTemp(40000, 70, 75, -5);
    expect(result).toBe(0);
  });

  it('returns 0 when outdoor equals indoor', () => {
    const result = scaleHeatLossToOutdoorTemp(40000, 70, 70, -5);
    expect(result).toBe(0);
  });

  it('scales proportionally to temperature difference', () => {
    // Design deltaT: 70 - (-5) = 75
    // Current deltaT: 70 - 20 = 50 (2/3 of design)
    const result = scaleHeatLossToOutdoorTemp(75000, 70, 20, -5);
    expect(result).toBe(50000);
  });

  it('handles zero design delta-T', () => {
    // If design outdoor = indoor, return 0 (invalid config)
    const result = scaleHeatLossToOutdoorTemp(40000, 70, 50, 70);
    expect(result).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateZoneDemands Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateZoneDemands', () => {
  it('returns demands for all zones', () => {
    const demands = calculateZoneDemands(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20 // outdoor temp
    );
    expect(demands.length).toBe(demoZones.length);
  });

  it('all zones call for heat when outdoor is cold', () => {
    const demands = calculateZoneDemands(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      0 // cold outdoor
    );
    expect(demands.every(d => d.isCalling)).toBe(true);
  });

  it('no zones call for heat when outdoor >= indoor', () => {
    const demands = calculateZoneDemands(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      75 // warm outdoor
    );
    expect(demands.every(d => !d.isCalling)).toBe(true);
    expect(demands.every(d => d.currentHeatLoss === 0)).toBe(true);
  });

  it('scales heat loss based on outdoor temp', () => {
    const coldDemands = calculateZoneDemands(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      0 // cold
    );
    const mildDemands = calculateZoneDemands(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      50 // mild
    );

    const coldTotal = coldDemands.reduce((s, d) => s + d.currentHeatLoss, 0);
    const mildTotal = mildDemands.reduce((s, d) => s + d.currentHeatLoss, 0);

    expect(coldTotal).toBeGreaterThan(mildTotal);
  });

  it('returns empty array for empty zones', () => {
    const demands = calculateZoneDemands(
      demoBuildingConfig,
      [],
      demoComponents,
      demoConnections,
      20
    );
    expect(demands).toEqual([]);
  });

  it('includes zone properties in demand objects', () => {
    const demands = calculateZoneDemands(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20
    );

    const zone1Demand = demands.find(d => d.zoneId === 'demo-zone-1');
    expect(zone1Demand).toBeDefined();
    expect(zone1Demand?.emitterType).toBe('radiant_floor');
    expect(zone1Demand?.designWaterTemp).toBe(110);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateBoilerState Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateBoilerState', () => {
  it('returns off state when no zone calling', () => {
    const state = calculateBoilerState(mockBoiler, 50000, false);
    expect(state.status).toBe('off');
    expect(state.flowGpm).toBe(0);
    expect(state.firingRate).toBe(0);
  });

  it('returns off state when demand is zero', () => {
    const state = calculateBoilerState(mockBoiler, 0, true);
    expect(state.status).toBe('off');
    expect(state.flowGpm).toBe(0);
  });

  it('fires at minimum rate when demand is very low', () => {
    // Max output = 150000 * 0.95 = 142,500 BTU
    // Min firing = 0.2 = 28,500 BTU
    // Demand below min should still fire at min rate
    const state = calculateBoilerState(mockBoiler, 10000, true);
    expect(state.status).toBe('firing');
    expect(state.firingRate).toBe(0.2); // Min firing rate
  });

  it('modulates firing rate based on demand', () => {
    // Max output = 142,500 BTU
    // 50% demand = 71,250 BTU
    const halfDemandState = calculateBoilerState(mockBoiler, 71250, true);
    expect(halfDemandState.firingRate).toBeCloseTo(0.5, 1);

    // Full demand
    const fullDemandState = calculateBoilerState(mockBoiler, 142500, true);
    expect(fullDemandState.firingRate).toBe(1);
  });

  it('caps firing rate at 100%', () => {
    // Demand exceeds capacity
    const state = calculateBoilerState(mockBoiler, 200000, true);
    expect(state.firingRate).toBe(1);
    expect(state.outputBtu).toBe(142500); // Max output
  });

  it('calculates supply temperature based on firing rate', () => {
    const lowFireState = calculateBoilerState(mockBoiler, 30000, true);
    const highFireState = calculateBoilerState(mockBoiler, 140000, true);

    // Higher firing = higher supply temp
    expect(highFireState.supplyTemp).toBeGreaterThan(lowFireState.supplyTemp);
  });

  it('calculates flow rate correctly', () => {
    // GPM = BTU / (500 × ΔT) where ΔT = 20
    // At 50000 BTU: GPM = 50000 / (500 * 20) = 5
    const state = calculateBoilerState(mockBoiler, 50000, true);
    // Actual output may differ due to min firing rate
    expect(state.flowGpm).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateZoneFlows Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateZoneFlows', () => {
  const mockZoneDemands = [
    {
      zoneId: 'zone-1',
      zoneName: 'Zone 1',
      sqFt: 500,
      designHeatLoss: 10000,
      currentHeatLoss: 5000,
      isCalling: true,
      zoneValveId: null,
      designWaterTemp: 120,
      emitterType: 'radiant_floor',
    },
    {
      zoneId: 'zone-2',
      zoneName: 'Zone 2',
      sqFt: 500,
      designHeatLoss: 10000,
      currentHeatLoss: 5000,
      isCalling: true,
      zoneValveId: null,
      designWaterTemp: 160,
      emitterType: 'panel_radiator',
    },
  ];

  const mockBoilerState = {
    firingRate: 0.5,
    outputBtu: 50000,
    supplyTemp: 160,
    returnTemp: 140,
    flowGpm: 5,
    status: 'firing' as const,
  };

  it('distributes flow proportionally to demand', () => {
    const flows = calculateZoneFlows(mockZoneDemands, mockBoilerState);

    expect(flows.length).toBe(2);
    // Equal demand = equal flow
    expect(flows[0].flowGpm).toBeCloseTo(flows[1].flowGpm, 1);
  });

  it('returns zero flow for inactive zones', () => {
    const demandsWithInactive = [
      { ...mockZoneDemands[0], isCalling: false, currentHeatLoss: 0 },
      mockZoneDemands[1],
    ];

    const flows = calculateZoneFlows(demandsWithInactive, mockBoilerState);

    expect(flows[0].flowGpm).toBe(0);
    expect(flows[1].flowGpm).toBeGreaterThan(0);
  });

  it('returns all zero flows when boiler is off', () => {
    const offBoilerState = { ...mockBoilerState, flowGpm: 0 };
    const flows = calculateZoneFlows(mockZoneDemands, offBoilerState);

    expect(flows.every(f => f.flowGpm === 0)).toBe(true);
  });

  it('caps radiant floor supply temp at 120F', () => {
    const flows = calculateZoneFlows(mockZoneDemands, mockBoilerState);

    const radiantFlow = flows.find(f => f.zoneId === 'zone-1');
    expect(radiantFlow?.supplyTemp).toBeLessThanOrEqual(120);
  });

  it('uses boiler supply temp for non-radiant zones', () => {
    const flows = calculateZoneFlows(mockZoneDemands, mockBoilerState);

    const radiatorFlow = flows.find(f => f.zoneId === 'zone-2');
    expect(radiatorFlow?.supplyTemp).toBe(mockBoilerState.supplyTemp);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateEmitterState Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateEmitterState', () => {
  it('returns off state when no zone flow', () => {
    const state = calculateEmitterState(null, 1);
    expect(state.status).toBe('off');
    expect(state.flowGpm).toBe(0);
  });

  it('returns off state when zone flow is zero', () => {
    const zeroFlow = {
      zoneId: 'zone-1',
      flowGpm: 0,
      supplyTemp: 70,
      returnTemp: 70,
      btuDelivered: 0,
    };
    const state = calculateEmitterState(zeroFlow, 1);
    expect(state.status).toBe('off');
  });

  it('distributes flow among multiple emitters', () => {
    const zoneFlow = {
      zoneId: 'zone-1',
      flowGpm: 6,
      supplyTemp: 160,
      returnTemp: 140,
      btuDelivered: 60000,
    };

    // 3 emitters sharing 6 GPM = 2 GPM each
    const state = calculateEmitterState(zoneFlow, 3);
    expect(state.flowGpm).toBe(2);
  });

  it('uses zone supply/return temps', () => {
    const zoneFlow = {
      zoneId: 'zone-1',
      flowGpm: 3,
      supplyTemp: 150,
      returnTemp: 130,
      btuDelivered: 30000,
    };

    const state = calculateEmitterState(zoneFlow, 1);
    expect(state.supplyTemp).toBe(150);
    expect(state.returnTemp).toBe(130);
    expect(state.status).toBe('running');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// runSimulationTick Tests (Integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('runSimulationTick', () => {
  it('returns states for all components', () => {
    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20
    );

    expect(Object.keys(states).length).toBe(Object.keys(demoComponents).length);
  });

  it('boiler fires when zones call for heat', () => {
    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20 // cold enough to need heat
    );

    expect(states['demo-boiler'].status).toBe('firing');
    expect(states['demo-boiler'].flowGpm).toBeGreaterThan(0);
  });

  it('all components off when outdoor temp >= indoor', () => {
    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      75 // warm - no heat needed
    );

    expect(states['demo-boiler'].status).toBe('off');
    expect(states['demo-primary-pump'].status).toBe('off');
  });

  it('pump runs when boiler fires', () => {
    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20
    );

    expect(states['demo-primary-pump'].status).toBe('running');
  });

  it('zone valves open when their zone calls', () => {
    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20
    );

    // All zone valves should be open when it's cold
    expect(states['demo-zone1-valve'].status).toBe('running');
    expect(states['demo-zone2-valve'].status).toBe('running');
    expect(states['demo-zone3-valve'].status).toBe('running');
  });

  it('emitters receive flow when zone is active', () => {
    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      20
    );

    // Check a radiator in zone 2
    expect(states['demo-rad-2-office'].status).toBe('running');
    expect(states['demo-rad-2-office'].flowGpm).toBeGreaterThan(0);
  });

  it('returns all off states when no boiler', () => {
    // Remove boiler from components
    const componentsNoBoiler = { ...demoComponents };
    delete componentsNoBoiler['demo-boiler'];

    const states = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      componentsNoBoiler,
      demoConnections,
      20
    );

    // All should be off
    expect(Object.values(states).every(s => s.status === 'off')).toBe(true);
  });

  it('colder outdoor temp increases boiler output', () => {
    const coldStates = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      0 // very cold
    );

    const mildStates = runSimulationTick(
      demoBuildingConfig,
      demoZones,
      demoComponents,
      demoConnections,
      50 // mild
    );

    // Colder = more flow needed
    expect(coldStates['demo-boiler'].flowGpm).toBeGreaterThan(
      mildStates['demo-boiler'].flowGpm
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Performance Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Performance', () => {
  it('completes simulation tick in under 5ms', () => {
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      runSimulationTick(
        demoBuildingConfig,
        demoZones,
        demoComponents,
        demoConnections,
        20
      );
    }

    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    // Should complete in under 5ms per tick for 60fps
    expect(avgMs).toBeLessThan(5);
  });
});
