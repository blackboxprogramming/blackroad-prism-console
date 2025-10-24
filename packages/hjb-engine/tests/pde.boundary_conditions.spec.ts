import { createGrid, createValueArray } from '../src/common/grid.js';
import { computeGodunovGradient } from '../src/pde/godunov_upwind.js';

describe('boundary handling', () => {
  it('clamps derivatives at the edges', () => {
    const grid = createGrid({ shape: [3, 3], spacing: [1, 1], origin: [0, 0] });
    const values = createValueArray(grid);
    values.set([0, 1, 2, 1, 2, 3, 2, 3, 4]);
    const gradient = computeGodunovGradient(grid, values, [0, 0]);
    expect(gradient.backward.length).toBe(2);
    expect(gradient.forward.length).toBe(2);
  });
});
