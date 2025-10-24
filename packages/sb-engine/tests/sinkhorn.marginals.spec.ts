import { computeCostMatrix } from '../src/kernel/costs.js';
import { logSinkhorn } from '../src/sinkhorn/logsinkhorn.js';

function normalize(values: number[]): Float64Array {
  const total = values.reduce((acc, v) => acc + v, 0);
  return Float64Array.from(values.map((v) => v / total));
}

describe('logSinkhorn marginal matching', () => {
  it('balances marginals within tolerance', () => {
    const xs = [[0], [1], [2]];
    const ys = [[0], [2], [4]];
    const mu = normalize([0.2, 0.5, 0.3]);
    const nu = normalize([0.4, 0.2, 0.4]);
    const { matrix, rows, cols } = computeCostMatrix(xs, ys, { metric: 'l2' });

    const result = logSinkhorn(mu, nu, matrix, rows, cols, {
      epsilon: 0.5,
      tolerance: 1e-6,
      maxIterations: 500,
      checkInterval: 1
    });

    expect(result.converged).toBe(true);
    const last = result.history[result.history.length - 1];
    expect(last.marginalError).toBeLessThan(1e-5);
    expect(result.diagnostics.marginalError).toBeLessThan(1e-5);
  });
});
