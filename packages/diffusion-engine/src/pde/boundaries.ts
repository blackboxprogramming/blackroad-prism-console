import { RectGrid } from '../common/grid.js';
import type { BoundaryCondition } from '../types.js';

export function enforceBoundary(
  grid: RectGrid,
  field: Float32Array,
  boundary: BoundaryCondition
): void {
  if (boundary === 'periodic') {
    enforcePeriodic(grid, field);
  } else {
    enforceNeumann(grid, field);
  }
}

function enforceNeumann(grid: RectGrid, field: Float32Array): void {
  const { width, height } = grid;
  for (let i = 0; i < width; i++) {
    field[grid.index(i, 0)] = field[grid.index(i, 1)];
    field[grid.index(i, height - 1)] = field[grid.index(i, height - 2)];
  }
  for (let j = 0; j < height; j++) {
    field[grid.index(0, j)] = field[grid.index(1, j)];
    field[grid.index(width - 1, j)] = field[grid.index(width - 2, j)];
  }
}

function enforcePeriodic(grid: RectGrid, field: Float32Array): void {
  const { width, height } = grid;
  for (let i = 0; i < width; i++) {
    field[grid.index(i, 0)] = field[grid.index(i, height - 2)];
    field[grid.index(i, height - 1)] = field[grid.index(i, 1)];
  }
  for (let j = 0; j < height; j++) {
    field[grid.index(0, j)] = field[grid.index(width - 2, j)];
    field[grid.index(width - 1, j)] = field[grid.index(1, j)];
  }
}
