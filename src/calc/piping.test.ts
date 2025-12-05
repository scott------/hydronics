// ─────────────────────────────────────────────────────────────────────────────
// Piping Calculation Tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import {
  pipeID,
  velocity,
  frictionLossPer100Ft,
  fittingEquivLength,
  totalEquivalentLength,
  pipeHeadLoss,
  velocityWarning,
} from './piping';
import type { PipeFittings } from '../types';

describe('pipeID', () => {
  it('returns correct ID for 3/4" copper', () => {
    expect(pipeID.copper['3/4']).toBe(0.785);
  });

  it('returns correct ID for 1" PEX', () => {
    expect(pipeID.pex['1']).toBe(0.862);
  });

  it('has all standard sizes for each material', () => {
    const sizes = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2'] as const;
    const materials = ['copper', 'pex', 'pex_al_pex', 'black_steel', 'cpvc'] as const;
    
    for (const material of materials) {
      for (const size of sizes) {
        expect(pipeID[material][size]).toBeGreaterThan(0);
      }
    }
  });
});

describe('velocity', () => {
  it('calculates correct velocity for 4 GPM in 3/4" pipe', () => {
    // V = 0.408 * 4 / (0.785)^2 = 2.65 fps
    const v = velocity(4, 0.785);
    expect(v).toBeCloseTo(2.65, 1);
  });

  it('returns 0 for zero ID', () => {
    expect(velocity(4, 0)).toBe(0);
  });

  it('returns 0 for negative ID', () => {
    expect(velocity(4, -1)).toBe(0);
  });

  it('velocity increases with GPM', () => {
    const v1 = velocity(2, 0.785);
    const v2 = velocity(4, 0.785);
    expect(v2).toBeGreaterThan(v1);
  });

  it('velocity decreases with larger pipe', () => {
    const vSmall = velocity(4, 0.545);
    const vLarge = velocity(4, 1.025);
    expect(vSmall).toBeGreaterThan(vLarge);
  });
});

describe('frictionLossPer100Ft', () => {
  it('returns positive loss for typical flow', () => {
    const loss = frictionLossPer100Ft(4, 'copper', '3/4');
    expect(loss).toBeGreaterThan(0);
  });

  it('returns 0 for zero GPM', () => {
    expect(frictionLossPer100Ft(0, 'copper', '3/4')).toBe(0);
  });

  it('loss increases with flow rate', () => {
    const loss2 = frictionLossPer100Ft(2, 'copper', '3/4');
    const loss4 = frictionLossPer100Ft(4, 'copper', '3/4');
    const loss8 = frictionLossPer100Ft(8, 'copper', '3/4');
    expect(loss4).toBeGreaterThan(loss2);
    expect(loss8).toBeGreaterThan(loss4);
  });

  it('loss decreases with larger pipe size', () => {
    const loss34 = frictionLossPer100Ft(4, 'copper', '3/4');
    const loss1 = frictionLossPer100Ft(4, 'copper', '1');
    expect(loss34).toBeGreaterThan(loss1);
  });

  it('copper has less friction than black steel (higher C factor)', () => {
    const copperLoss = frictionLossPer100Ft(4, 'copper', '3/4');
    const steelLoss = frictionLossPer100Ft(4, 'black_steel', '3/4');
    expect(copperLoss).toBeLessThan(steelLoss);
  });

  it('returns reasonable values for residential flow', () => {
    // 4 GPM in 3/4" copper should be ~3-5 ft per 100ft
    const loss = frictionLossPer100Ft(4, 'copper', '3/4');
    expect(loss).toBeGreaterThan(1);
    expect(loss).toBeLessThan(10);
  });
});

describe('fittingEquivLength', () => {
  it('90° elbow has higher equiv length than 45°', () => {
    expect(fittingEquivLength['3/4'].elbow90).toBeGreaterThan(
      fittingEquivLength['3/4'].elbow45
    );
  });

  it('tee branch has higher equiv length than tee through', () => {
    expect(fittingEquivLength['3/4'].teeBranch).toBeGreaterThan(
      fittingEquivLength['3/4'].teeThru
    );
  });

  it('larger pipes have higher equiv lengths', () => {
    expect(fittingEquivLength['1'].elbow90).toBeGreaterThan(
      fittingEquivLength['3/4'].elbow90
    );
  });
});

describe('totalEquivalentLength', () => {
  const noFittings: PipeFittings = {
    elbows90: 0,
    elbows45: 0,
    teesThrough: 0,
    teesBranch: 0,
    couplings: 0,
  };

  const typicalFittings: PipeFittings = {
    elbows90: 4,
    elbows45: 0,
    teesThrough: 2,
    teesBranch: 1,
    couplings: 2,
  };

  it('returns pipe length when no fittings', () => {
    expect(totalEquivalentLength(50, '3/4', noFittings)).toBe(50);
  });

  it('adds fitting equivalent lengths', () => {
    const total = totalEquivalentLength(50, '3/4', typicalFittings);
    // 50 + 4*2 + 0 + 2*1.2 + 1*4 + 2*0.4 = 50 + 8 + 2.4 + 4 + 0.8 = 65.2
    expect(total).toBeCloseTo(65.2, 1);
  });

  it('is always >= pipe length', () => {
    expect(totalEquivalentLength(100, '3/4', typicalFittings)).toBeGreaterThanOrEqual(100);
  });
});

describe('pipeHeadLoss', () => {
  const fittings: PipeFittings = {
    elbows90: 2,
    elbows45: 0,
    teesThrough: 1,
    teesBranch: 0,
    couplings: 1,
  };

  it('calculates total head loss for pipe segment', () => {
    const loss = pipeHeadLoss(4, 'copper', '3/4', 50, fittings);
    expect(loss).toBeGreaterThan(0);
  });

  it('increases with pipe length', () => {
    const noFittings: PipeFittings = {
      elbows90: 0,
      elbows45: 0,
      teesThrough: 0,
      teesBranch: 0,
      couplings: 0,
    };
    const loss50 = pipeHeadLoss(4, 'copper', '3/4', 50, noFittings);
    const loss100 = pipeHeadLoss(4, 'copper', '3/4', 100, noFittings);
    expect(loss100).toBeCloseTo(loss50 * 2, 1);
  });

  it('returns reasonable values', () => {
    // 50ft of 3/4" copper at 4 GPM with fittings should be ~2-5 ft head
    const loss = pipeHeadLoss(4, 'copper', '3/4', 50, fittings);
    expect(loss).toBeGreaterThan(0.5);
    expect(loss).toBeLessThan(10);
  });
});

describe('velocityWarning', () => {
  it('returns "low" for very low flow', () => {
    // 0.5 GPM in 3/4" copper => V = 0.33 fps
    expect(velocityWarning(0.5, 'copper', '3/4')).toBe('low');
  });

  it('returns "ok" for typical residential flow', () => {
    // 4 GPM in 3/4" copper => V = 2.65 fps
    expect(velocityWarning(4, 'copper', '3/4')).toBe('ok');
  });

  it('returns "high" for excessive flow', () => {
    // 10 GPM in 1/2" copper => V = 15.4 fps
    expect(velocityWarning(10, 'copper', '1/2')).toBe('high');
  });

  it('boundary at 1.5 fps', () => {
    // Find GPM that gives ~1.5 fps in 3/4" copper
    // V = 0.408 * GPM / ID^2 => GPM = V * ID^2 / 0.408
    // GPM = 1.5 * 0.785^2 / 0.408 = 2.27
    expect(velocityWarning(2.2, 'copper', '3/4')).toBe('low');
    expect(velocityWarning(2.4, 'copper', '3/4')).toBe('ok');
  });

  it('boundary at 4 fps', () => {
    // GPM = 4 * 0.785^2 / 0.408 = 6.05
    expect(velocityWarning(6, 'copper', '3/4')).toBe('ok');
    expect(velocityWarning(6.2, 'copper', '3/4')).toBe('high');
  });
});
