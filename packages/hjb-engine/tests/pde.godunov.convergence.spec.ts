import { createGrid, solveStationary, createSingleIntegrator, createQuadraticCost, coordsFromIndex, positionFromCoords } from '../src/index.js';

describe('godunov upwind convergence', () => {
  it('approximates quadratic value for single integrator', () => {
    const grid = createGrid({ shape: [51], spacing: [0.2], origin: [-5] });
    const dynamics = createSingleIntegrator({ dimension: 1, controlLimit: 3, controlResolution: 0.5 });
    const cost = createQuadraticCost({ stateWeights: [1], controlWeights: [1] });
    const result = solveStationary({ grid, dynamics, cost, tolerance: 1e-4, maxIterations: 4000, damping: 0.4 });

    let error = 0;
    for (let index = 0; index < grid.size; index += 1) {
      const coords = coordsFromIndex(grid, index);
      const position = positionFromCoords(grid, coords);
      const expected = 0.5 * position[0] * position[0];
      error += Math.abs(result.value[index] - expected);
    }
    const meanError = error / grid.size;
    expect(meanError).toBeLessThan(0.2);
  });
});
