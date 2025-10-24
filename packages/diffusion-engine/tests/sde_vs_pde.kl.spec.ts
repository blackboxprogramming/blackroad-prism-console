import { RectGrid, runEulerMaruyama, runFokkerPlanck, kl } from '@blackroad/diffusion-engine';
import type { SDEConfig, FPConfig } from '@blackroad/diffusion-engine';

describe('SDE vs PDE comparison', () => {
  it('produces decreasing KL divergence for the double well preset', () => {
    const grid = new RectGrid({ width: 32, height: 32, domain: 2 });
    const sdeCfg: SDEConfig = {
      potential: 'double_well',
      steps: 200,
      dt: 0.005,
      betaSchedule: 'const:0.02',
      particles: 4000,
      seed: 5,
      grid,
      recordEvery: 20
    };
    const fpCfg: FPConfig = {
      potential: 'double_well',
      betaSchedule: 'const:0.02',
      steps: 100,
      dt: 0.01,
      grid,
      boundary: 'neumann',
      seed: 5
    };
    const sde = runEulerMaruyama(sdeCfg);
    const fp = runFokkerPlanck(fpCfg);
    const length = Math.min(sde.densities.length, fp.densities.length);
    const series: number[] = [];
    for (let i = 0; i < length; i++) {
      series.push(kl(sde.densities[i], fp.densities[i]));
    }
    expect(series[series.length - 1]).toBeLessThan(series[0]);
  });
});
