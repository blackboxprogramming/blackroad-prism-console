import { clamp } from './boundaries.js';
import type { Vector, GridSpec, Grid } from '../types.js';

export function createGrid(spec: GridSpec): Grid {
  if (spec.shape.length === 0) {
    throw new Error('Grid must have at least one dimension');
  }
  if (spec.spacing.length !== spec.shape.length || spec.origin.length !== spec.shape.length) {
    throw new Error('Grid spacing/origin must match shape dimensionality');
  }

  const strides: number[] = new Array(spec.shape.length).fill(0);
  let stride = 1;
  for (let i = spec.shape.length - 1; i >= 0; i -= 1) {
    strides[i] = stride;
    stride *= spec.shape[i];
  }

  return {
    spec,
    size: stride,
    strides
  };
}

export function indexFromCoords(grid: Grid, coords: number[]): number {
  if (coords.length !== grid.spec.shape.length) {
    throw new Error('Coordinate dimensionality mismatch');
  }
  let index = 0;
  for (let i = 0; i < coords.length; i += 1) {
    if (coords[i] < 0 || coords[i] >= grid.spec.shape[i]) {
      throw new Error(`Coordinate ${i} out of bounds`);
    }
    index += coords[i] * grid.strides[i];
  }
  return index;
}

export function coordsFromIndex(grid: Grid, index: number): number[] {
  if (index < 0 || index >= grid.size) {
    throw new Error('Index out of bounds');
  }
  const coords = new Array(grid.spec.shape.length).fill(0);
  let remainder = index;
  for (let i = 0; i < coords.length; i += 1) {
    const stride = grid.strides[i];
    const value = Math.floor(remainder / stride);
    coords[i] = value % grid.spec.shape[i];
    remainder -= value * stride;
  }
  return coords;
}

export function positionFromCoords(grid: Grid, coords: number[]): Vector {
  const pos: number[] = new Array(coords.length).fill(0);
  for (let i = 0; i < coords.length; i += 1) {
    pos[i] = grid.spec.origin[i] + coords[i] * grid.spec.spacing[i];
  }
  return pos;
}

export function neighborIndex(grid: Grid, coords: number[], dimension: number, offset: number, boundary: 'clamp' | 'wrap' = 'clamp'): number {
  const adjusted = coords.slice();
  adjusted[dimension] = clamp(adjusted[dimension] + offset, 0, grid.spec.shape[dimension] - 1, boundary, grid.spec.shape[dimension]);
  return indexFromCoords(grid, adjusted);
}

export function iterateGrid(grid: Grid, visitor: (index: number, coords: number[], position: Vector) => void) {
  const coords = new Array(grid.spec.shape.length).fill(0);
  for (let index = 0; index < grid.size; index += 1) {
    const remainder = index;
    let value = remainder;
    for (let dim = 0; dim < coords.length; dim += 1) {
      const stride = grid.strides[dim];
      const coord = Math.floor(value / stride) % grid.spec.shape[dim];
      coords[dim] = coord;
      value -= coord * stride;
    }
    visitor(index, coords, positionFromCoords(grid, coords));
  }
}

export function createValueArray(grid: Grid, fill = 0): Float64Array {
  const values = new Float64Array(grid.size);
  values.fill(fill);
  return values;
}

export function cloneValues(values: Float64Array): Float64Array {
  return new Float64Array(values);
}
