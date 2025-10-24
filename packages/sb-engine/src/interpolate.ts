import { barycentric } from './barycentric.js';

export interface InterpolationOptions {
  rows: number;
  cols: number;
}

export type Frame = {
  t: number;
  positions: number[][];
};

export function interpolate(
  coupling: Float64Array,
  sourcePoints: number[][],
  targetPoints: number[][],
  times: number[],
  options: InterpolationOptions
): Frame[] {
  const map = barycentric(coupling, targetPoints, options);
  return times.map((t) => {
    const positions: number[][] = sourcePoints.map((point, idx) => {
      const target = map.map[idx];
      return point.map((value, dim) => (1 - t) * value + t * target[dim]);
    });
    return { t, positions };
  });
}
