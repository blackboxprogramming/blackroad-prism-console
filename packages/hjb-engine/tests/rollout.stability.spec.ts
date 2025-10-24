import { createSingleIntegrator } from '../src/dynamics/integrator.js';
import { createQuadraticCost } from '../src/costs/quadratic.js';
import { simulateRollout } from '../src/rollout/simulate.js';

const dynamics = createSingleIntegrator({ dimension: 2, controlLimit: 5 });
const cost = createQuadraticCost({ stateWeights: [1, 1], controlWeights: [1, 1] });

describe('rollout stability', () => {
  it('drives state towards origin', () => {
    const policy = (state: number[]) => state.map((value) => -value);
    const result = simulateRollout({ dynamics, policy, start: [1, -1], dt: 0.1, steps: 50, cost });
    expect(result.samples.length).toBe(50);
    const last = result.samples[result.samples.length - 1];
    expect(Math.abs(last.state[0])).toBeLessThan(0.1);
    expect(Math.abs(last.state[1])).toBeLessThan(0.1);
    expect(result.totalCost).toBeGreaterThan(0);
  });
});
