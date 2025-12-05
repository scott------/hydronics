// ─────────────────────────────────────────────────────────────────────────────
// Heat-loss calculation engine (simplified ACCA Manual J approach)
// ─────────────────────────────────────────────────────────────────────────────
import type { BuildingConfig, Zone } from '../types';

export interface HeatLossBreakdown {
  walls: number;
  windows: number;
  doors: number;
  ceiling: number;
  floor: number;
  infiltration: number;
  total: number;
}

/**
 * Calculate U-value from R-value
 */
export function rToU(r: number): number {
  return r > 0 ? 1 / r : 1;
}

/**
 * Compute delta-T between indoor and outdoor design temps
 */
export function deltaT(building: BuildingConfig): number {
  return building.climate.indoorDesignTemp - building.climate.designOutdoorTemp;
}

/**
 * Estimate wall area (simplified: perimeter × height minus window/door area).
 * Assumes square footprint for perimeter estimate.
 */
export function estimateWallArea(building: BuildingConfig): number {
  const footprintSqFt = building.totalSqFt / building.floors;
  const side = Math.sqrt(footprintSqFt);
  const perimeter = 4 * side;
  const grossWall = perimeter * building.ceilingHeight * building.floors;
  const windowArea = building.windowDoor.totalWindowArea;
  const doorArea = building.windowDoor.exteriorDoorCount * building.windowDoor.doorArea;
  return Math.max(0, grossWall - windowArea - doorArea);
}

/**
 * Compute building volume in cubic feet
 */
export function buildingVolume(building: BuildingConfig): number {
  return building.totalSqFt * building.ceilingHeight;
}

/**
 * Calculate infiltration CFM from ACH
 */
export function infiltrationCFM(building: BuildingConfig): number {
  const vol = buildingVolume(building);
  return (vol * building.infiltration.ach) / 60;
}

/**
 * Main heat-loss calculation returning BTU/hr breakdown
 */
export function calculateHeatLoss(building: BuildingConfig): HeatLossBreakdown {
  const dt = deltaT(building);

  // Walls
  const wallArea = estimateWallArea(building);
  const wallU = rToU(building.insulation.walls);
  const walls = wallU * wallArea * dt;

  // Windows (U-value provided directly)
  const windowArea = building.windowDoor.totalWindowArea;
  const windows = building.windowDoor.windowUValue * windowArea * dt;

  // Doors
  const doorArea = building.windowDoor.exteriorDoorCount * building.windowDoor.doorArea;
  const doors = building.windowDoor.doorUValue * doorArea * dt;

  // Ceiling
  const ceilingArea = building.totalSqFt / building.floors; // top floor only simplified
  const ceilingU = rToU(building.insulation.ceiling);
  const ceiling = ceilingU * ceilingArea * dt;

  // Floor / foundation
  const floorArea = building.totalSqFt / building.floors;
  const floorU = rToU(building.insulation.floor);
  // Simplified: basement/crawl has reduced ΔT (ground ~55°F), slab uses full ΔT
  const floorDt =
    building.foundationType === 'slab' ? dt : building.climate.indoorDesignTemp - 55;
  const floor = floorU * floorArea * Math.max(0, floorDt);

  // Infiltration: Q = 0.018 × CFM × ΔT (sensible only)
  const cfm = infiltrationCFM(building);
  const infiltration = 0.018 * cfm * dt;

  const total = walls + windows + doors + ceiling + floor + infiltration;

  return { walls, windows, doors, ceiling, floor, infiltration, total };
}

/**
 * Allocate building heat loss to zones proportionally by sqFt (unless overridden)
 */
export function allocateZoneHeatLoss(
  totalLoss: number,
  totalSqFt: number,
  zones: Zone[]
): Map<string, number> {
  const result = new Map<string, number>();
  for (const z of zones) {
    if (z.heatLossOverride !== null) {
      result.set(z.id, z.heatLossOverride);
    } else {
      result.set(z.id, (z.sqFt / totalSqFt) * totalLoss);
    }
  }
  return result;
}

/**
 * Calculate required GPM for a given BTU load and temperature drop
 * GPM = BTU / (500 × ΔT)
 */
export function requiredGPM(btu: number, deltaT: number): number {
  if (deltaT <= 0) return 0;
  return btu / (500 * deltaT);
}

/**
 * Calculate BTU output from GPM and ΔT
 */
export function btuFromFlow(gpm: number, deltaT: number): number {
  return gpm * 500 * deltaT;
}
