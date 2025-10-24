import { runEulerMaruyama } from '@blackroad/diffusion-engine';
import type { SDEConfig } from '@blackroad/diffusion-engine';

function variance(values: Float32Array, stride = 2): number {
  const n = values.length / stride;
  let mean = 0;
  for (let i = 0; i < values.length; i += stride) {
    mean += values[i];
  }
  mean /= n;
  let acc = 0;
  for (let i = 0; i < values.length; i += stride) {
    const diff = values[i] - mean;
    acc += diff * diff;
  }
  return acc / Math.max(n - 1, 1);
}

describe('Euler–Maruyama consistency', () => {
  it('matches variance growth for pure diffusion', () => {
    const cfg: SDEConfig = {
      potential: 'none',
      steps: 200,
      dt: 0.01,
      betaSchedule: 'const:0.05',
      particles: 2000,
      seed: 7,
      recordEvery: 50
    };
    const result = runEulerMaruyama(cfg);
    const final = result.trajectories[result.trajectories.length - 1];
    const varX = variance(final);
    const expected = 1 + 2 * 0.05 * cfg.steps * cfg.dt;
    expect(Math.abs(varX - expected)).toBeLessThan(0.1);
  });
});
