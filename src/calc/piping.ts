// ─────────────────────────────────────────────────────────────────────────────
// Pipe friction & equivalent length tables (simplified)
// ─────────────────────────────────────────────────────────────────────────────
import type { PipeMaterial, PipeSize, PipeFittings } from '../types';

/** Inside diameters in inches */
export const pipeID: Record<PipeMaterial, Record<PipeSize, number>> = {
  copper: {
    '1/2': 0.545,
    '3/4': 0.785,
    '1': 1.025,
    '1-1/4': 1.265,
    '1-1/2': 1.505,
    '2': 1.985,
  },
  pex: {
    '1/2': 0.475,
    '3/4': 0.671,
    '1': 0.862,
    '1-1/4': 1.062,
    '1-1/2': 1.262,
    '2': 1.662,
  },
  pex_al_pex: {
    '1/2': 0.5,
    '3/4': 0.704,
    '1': 0.89,
    '1-1/4': 1.1,
    '1-1/2': 1.3,
    '2': 1.7,
  },
  black_steel: {
    '1/2': 0.622,
    '3/4': 0.824,
    '1': 1.049,
    '1-1/4': 1.38,
    '1-1/2': 1.61,
    '2': 2.067,
  },
  cpvc: {
    '1/2': 0.485,
    '3/4': 0.687,
    '1': 0.894,
    '1-1/4': 1.1,
    '1-1/2': 1.3,
    '2': 1.7,
  },
};

/** Friction loss (ft head per 100 ft) at 4 fps for reference; we'll derive from Hazen-Williams */
const C_FACTOR: Record<PipeMaterial, number> = {
  copper: 130,
  pex: 150,
  pex_al_pex: 145,
  black_steel: 100,
  cpvc: 140,
};

/**
 * Velocity in fps given GPM and ID (in)
 * V = 0.408 × GPM / ID²
 */
export function velocity(gpm: number, id: number): number {
  if (id <= 0) return 0;
  return (0.408 * gpm) / (id * id);
}

/**
 * Hazen-Williams head loss per 100 ft of pipe (ft)
 * HL = 0.002083 × L × (100/C)^1.852 × (GPM^1.852 / ID^4.8655)
 * Simplified for 100 ft: L=100
 */
export function frictionLossPer100Ft(
  gpm: number,
  material: PipeMaterial,
  size: PipeSize
): number {
  const id = pipeID[material][size];
  const c = C_FACTOR[material];
  if (id <= 0 || gpm <= 0) return 0;
  return 0.002083 * 100 * Math.pow(100 / c, 1.852) * (Math.pow(gpm, 1.852) / Math.pow(id, 4.8655));
}

/** Equivalent lengths (ft) for fittings – typical copper values, adjust per material */
export const fittingEquivLength: Record<PipeSize, { elbow90: number; elbow45: number; teeThru: number; teeBranch: number; coupling: number }> = {
  '1/2': { elbow90: 1.5, elbow45: 0.8, teeThru: 0.9, teeBranch: 3, coupling: 0.3 },
  '3/4': { elbow90: 2, elbow45: 1, teeThru: 1.2, teeBranch: 4, coupling: 0.4 },
  '1': { elbow90: 2.5, elbow45: 1.3, teeThru: 1.5, teeBranch: 5, coupling: 0.5 },
  '1-1/4': { elbow90: 3, elbow45: 1.5, teeThru: 1.8, teeBranch: 6, coupling: 0.6 },
  '1-1/2': { elbow90: 4, elbow45: 2, teeThru: 2.2, teeBranch: 8, coupling: 0.8 },
  '2': { elbow90: 5, elbow45: 2.5, teeThru: 3, teeBranch: 10, coupling: 1 },
};

/**
 * Calculate total equivalent length including fittings
 */
export function totalEquivalentLength(
  lengthFt: number,
  size: PipeSize,
  fittings: PipeFittings
): number {
  const eq = fittingEquivLength[size];
  const fittingLen =
    fittings.elbows90 * eq.elbow90 +
    fittings.elbows45 * eq.elbow45 +
    fittings.teesThrough * eq.teeThru +
    fittings.teesBranch * eq.teeBranch +
    fittings.couplings * eq.coupling;
  return lengthFt + fittingLen;
}

/**
 * Calculate total head loss for a pipe segment (ft)
 */
export function pipeHeadLoss(
  gpm: number,
  material: PipeMaterial,
  size: PipeSize,
  lengthFt: number,
  fittings: PipeFittings
): number {
  const eqLen = totalEquivalentLength(lengthFt, size, fittings);
  const lossPer100 = frictionLossPer100Ft(gpm, material, size);
  return (eqLen / 100) * lossPer100;
}

/**
 * Check velocity limits (residential: 1.5–4 fps)
 */
export function velocityWarning(
  gpm: number,
  material: PipeMaterial,
  size: PipeSize
): 'low' | 'ok' | 'high' {
  const id = pipeID[material][size];
  const v = velocity(gpm, id);
  if (v < 1.5) return 'low';
  if (v > 4) return 'high';
  return 'ok';
}
