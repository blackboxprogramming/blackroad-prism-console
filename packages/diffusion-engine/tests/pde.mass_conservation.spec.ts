import { RectGrid, runFokkerPlanck } from '@blackroad/diffusion-engine';
import type { FPConfig } from '@blackroad/diffusion-engine';

describe('Fokker–Planck solver', () => {
  it('approximately conserves mass', () => {
    const grid = new RectGrid({ width: 32, height: 32, domain: 2 });
    const cfg: FPConfig = {
      potential: 'double_well',
      betaSchedule: 'const:0.02',
      steps: 50,
      dt: 0.01,
      grid,
      boundary: 'neumann',
      seed: 11
    };
    const result = runFokkerPlanck(cfg);
    const reference = result.massHistory[0];
    for (const mass of result.massHistory) {
      expect(Math.abs(mass - reference)).toBeLessThan(1e-3);
    }
  });
});
