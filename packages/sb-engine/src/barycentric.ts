import { BarycentricMap } from './types.js';

export interface BarycentricOptions {
  rows: number;
  cols: number;
}

export function barycentric(
  coupling: Float64Array,
  targetPoints: number[][],
  options: BarycentricOptions
): BarycentricMap {
  const { rows, cols } = options;
  if (targetPoints.length !== cols) {
    throw new Error('Target points length must match columns of coupling');
  }

  const map: number[][] = Array.from({ length: rows }, () => Array(targetPoints[0].length).fill(0));
  const weights = new Float64Array(rows);

  for (let i = 0; i < rows; i += 1) {
    const base = i * cols;
    let denom = 0;
    for (let j = 0; j < cols; j += 1) {
      const pij = coupling[base + j];
      denom += pij;
      for (let d = 0; d < targetPoints[j].length; d += 1) {
        map[i][d] += pij * targetPoints[j][d];
      }
    }
    const inv = denom > 0 ? 1 / denom : 0;
    weights[i] = denom;
    for (let d = 0; d < map[i].length; d += 1) {
      map[i][d] *= inv;
    }
  }

  return { map, weights };
}
