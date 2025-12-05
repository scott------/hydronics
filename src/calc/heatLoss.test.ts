// ─────────────────────────────────────────────────────────────────────────────
// Heat Loss Calculation Tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import {
  rToU,
  deltaT,
  estimateWallArea,
  buildingVolume,
  infiltrationCFM,
  calculateHeatLoss,
  allocateZoneHeatLoss,
  requiredGPM,
  btuFromFlow,
} from './heatLoss';
import type { BuildingConfig, Zone } from '../types';

// Test fixture: typical 2000 sqft home
const mockBuilding: BuildingConfig = {
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

describe('rToU', () => {
  it('converts R-13 to correct U-value', () => {
    expect(rToU(13)).toBeCloseTo(0.0769, 3);
  });

  it('converts R-38 to correct U-value', () => {
    expect(rToU(38)).toBeCloseTo(0.0263, 3);
  });

  it('handles R-0 by returning 1', () => {
    expect(rToU(0)).toBe(1);
  });

  it('handles negative R by returning 1', () => {
    expect(rToU(-5)).toBe(1);
  });

  it('converts R-1 to U-1', () => {
    expect(rToU(1)).toBe(1);
  });
});

describe('deltaT', () => {
  it('calculates correct temperature difference', () => {
    expect(deltaT(mockBuilding)).toBe(70);
  });

  it('handles negative outdoor temps', () => {
    const coldClimate: BuildingConfig = {
      ...mockBuilding,
      climate: { ...mockBuilding.climate, designOutdoorTemp: -20 },
    };
    expect(deltaT(coldClimate)).toBe(90);
  });

  it('handles equal temps', () => {
    const equalTemps: BuildingConfig = {
      ...mockBuilding,
      climate: { ...mockBuilding.climate, designOutdoorTemp: 70 },
    };
    expect(deltaT(equalTemps)).toBe(0);
  });
});

describe('estimateWallArea', () => {
  it('calculates net wall area excluding windows and doors', () => {
    const area = estimateWallArea(mockBuilding);
    // 2000 sqft, 1 floor => ~44.7ft side, 178.9ft perimeter
    // Gross wall = 178.9 * 8 = 1431 sqft
    // Windows = 200, Doors = 2 * 20 = 40
    // Net = 1431 - 200 - 40 = 1191 sqft
    expect(area).toBeCloseTo(1191, -1);
  });

  it('handles multi-floor buildings', () => {
    const twoStory: BuildingConfig = {
      ...mockBuilding,
      floors: 2,
    };
    const area = estimateWallArea(twoStory);
    // Footprint = 1000 sqft => ~31.6ft side, 126.5ft perimeter
    // Gross wall = 126.5 * 8 * 2 = 2024 sqft
    // Net = 2024 - 200 - 40 = 1784 sqft
    expect(area).toBeCloseTo(1784, -1);
  });

  it('returns 0 when windows exceed wall area', () => {
    const allGlass: BuildingConfig = {
      ...mockBuilding,
      windowDoor: { ...mockBuilding.windowDoor, totalWindowArea: 5000 },
    };
    expect(estimateWallArea(allGlass)).toBe(0);
  });
});

describe('buildingVolume', () => {
  it('calculates correct volume', () => {
    expect(buildingVolume(mockBuilding)).toBe(16000); // 2000 * 8
  });

  it('handles different ceiling heights', () => {
    const tallCeiling: BuildingConfig = {
      ...mockBuilding,
      ceilingHeight: 10,
    };
    expect(buildingVolume(tallCeiling)).toBe(20000);
  });
});

describe('infiltrationCFM', () => {
  it('converts ACH to CFM correctly', () => {
    // Volume = 16000 cf, ACH = 0.35
    // CFM = 16000 * 0.35 / 60 = 93.33
    expect(infiltrationCFM(mockBuilding)).toBeCloseTo(93.33, 1);
  });

  it('handles zero ACH', () => {
    const tight: BuildingConfig = {
      ...mockBuilding,
      infiltration: { ...mockBuilding.infiltration, ach: 0 },
    };
    expect(infiltrationCFM(tight)).toBe(0);
  });
});

describe('calculateHeatLoss', () => {
  it('returns all breakdown components', () => {
    const result = calculateHeatLoss(mockBuilding);
    expect(result).toHaveProperty('walls');
    expect(result).toHaveProperty('windows');
    expect(result).toHaveProperty('doors');
    expect(result).toHaveProperty('ceiling');
    expect(result).toHaveProperty('floor');
    expect(result).toHaveProperty('infiltration');
    expect(result).toHaveProperty('total');
  });

  it('total equals sum of components', () => {
    const result = calculateHeatLoss(mockBuilding);
    const sum =
      result.walls +
      result.windows +
      result.doors +
      result.ceiling +
      result.floor +
      result.infiltration;
    expect(result.total).toBeCloseTo(sum, 0);
  });

  it('all components are non-negative', () => {
    const result = calculateHeatLoss(mockBuilding);
    expect(result.walls).toBeGreaterThanOrEqual(0);
    expect(result.windows).toBeGreaterThanOrEqual(0);
    expect(result.doors).toBeGreaterThanOrEqual(0);
    expect(result.ceiling).toBeGreaterThanOrEqual(0);
    expect(result.floor).toBeGreaterThanOrEqual(0);
    expect(result.infiltration).toBeGreaterThanOrEqual(0);
  });

  it('returns reasonable BTU/hr for typical home', () => {
    const result = calculateHeatLoss(mockBuilding);
    // Well-insulated 2000 sqft home with 70°F ΔT should be 15,000-50,000 BTU/hr
    expect(result.total).toBeGreaterThan(10000);
    expect(result.total).toBeLessThan(100000);
  });

  it('uses different floor delta-T for basement', () => {
    const slabBuilding: BuildingConfig = {
      ...mockBuilding,
      foundationType: 'slab',
    };
    const basementResult = calculateHeatLoss(mockBuilding);
    const slabResult = calculateHeatLoss(slabBuilding);
    // Slab should have higher floor loss (uses full ΔT vs ground temp)
    expect(slabResult.floor).toBeGreaterThan(basementResult.floor);
  });
});

describe('allocateZoneHeatLoss', () => {
  const zones: Zone[] = [
    { id: 'z1', name: 'Living Room', sqFt: 500, heatLossOverride: null, designWaterTemp: 140, emitterType: null, priority: 1 },
    { id: 'z2', name: 'Bedroom', sqFt: 300, heatLossOverride: null, designWaterTemp: 140, emitterType: null, priority: 2 },
    { id: 'z3', name: 'Kitchen', sqFt: 200, heatLossOverride: 5000, designWaterTemp: 140, emitterType: null, priority: 3 },
  ];

  it('allocates proportionally by sqFt', () => {
    const result = allocateZoneHeatLoss(40000, 1000, zones);
    expect(result.get('z1')).toBe(20000); // 500/1000 * 40000
    expect(result.get('z2')).toBe(12000); // 300/1000 * 40000
  });

  it('respects manual overrides', () => {
    const result = allocateZoneHeatLoss(40000, 1000, zones);
    expect(result.get('z3')).toBe(5000); // Override value
  });

  it('returns Map with all zones', () => {
    const result = allocateZoneHeatLoss(40000, 1000, zones);
    expect(result.size).toBe(3);
  });
});

describe('requiredGPM', () => {
  it('calculates GPM for typical 20°F delta-T', () => {
    // 10,000 BTU with 20°F ΔT => 1 GPM
    expect(requiredGPM(10000, 20)).toBe(1);
  });

  it('calculates GPM for 40,000 BTU load', () => {
    // 40,000 BTU with 20°F ΔT => 4 GPM
    expect(requiredGPM(40000, 20)).toBe(4);
  });

  it('returns 0 for zero delta-T', () => {
    expect(requiredGPM(40000, 0)).toBe(0);
  });

  it('returns 0 for negative delta-T', () => {
    expect(requiredGPM(40000, -10)).toBe(0);
  });
});

describe('btuFromFlow', () => {
  it('calculates BTU from GPM and delta-T', () => {
    // 4 GPM with 20°F ΔT => 40,000 BTU
    expect(btuFromFlow(4, 20)).toBe(40000);
  });

  it('returns 0 for zero GPM', () => {
    expect(btuFromFlow(0, 20)).toBe(0);
  });

  it('is inverse of requiredGPM', () => {
    const btu = 50000;
    const dt = 20;
    const gpm = requiredGPM(btu, dt);
    expect(btuFromFlow(gpm, dt)).toBeCloseTo(btu, 0);
  });
});
