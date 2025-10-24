import { computeCostMatrix } from '../src/kernel/costs.js';
import { logSinkhorn } from '../src/sinkhorn/logsinkhorn.js';

describe('logSinkhorn stability', () => {
  it('avoids NaN and monitors dual gap monotonicity', () => {
    const xs = Array.from({ length: 5 }, (_, i) => [i / 4]);
    const ys = Array.from({ length: 5 }, (_, i) => [i / 4]);
    const mu = Float64Array.from(xs, () => 1 / xs.length);
    const nu = Float64Array.from(ys, () => 1 / ys.length);
    const { matrix, rows, cols } = computeCostMatrix(xs, ys);

    const result = logSinkhorn(mu, nu, matrix, rows, cols, {
      epsilon: 0.1,
      tolerance: 1e-5,
      maxIterations: 300,
      checkInterval: 5
    });

    for (const entry of result.history) {
      expect(Number.isFinite(entry.marginalError)).toBe(true);
      expect(Number.isFinite(entry.dualGap)).toBe(true);
    }

    const gaps = result.history.map((entry) => entry.dualGap);
    for (let i = 1; i < gaps.length; i += 1) {
      expect(gaps[i]).toBeLessThanOrEqual(gaps[i - 1] + 1e-6);
    }
  });
});
