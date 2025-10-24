import { DensityField } from '../types';

export interface PowerCellResult {
  owner: Uint16Array;
  mass: number[];
  centroids: { x: number; y: number }[];
}

export function computePowerCells(
  points: { x: number; y: number; weight: number }[],
  field: DensityField
): PowerCellResult {
  const owner = new Uint16Array(field.width * field.height);
  const mass = Array(points.length).fill(0);
  const centroidSum = Array.from({ length: points.length }, () => ({ x: 0, y: 0 }));
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const idx = y * field.width + x;
      let best = 0;
      let bestValue = Infinity;
      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        const dx = x - point.x;
        const dy = y - point.y;
        const distance = dx * dx + dy * dy - point.weight;
        if (distance < bestValue) {
          bestValue = distance;
          best = i;
        }
      }
      owner[idx] = best;
      const density = field.values[idx];
      mass[best] += density;
      centroidSum[best].x += density * x;
      centroidSum[best].y += density * y;
    }
  }
  const centroids = centroidSum.map((sum, idx) => {
    const m = mass[idx] || 1e-9;
    return { x: sum.x / m, y: sum.y / m };
  });
  return { owner, mass, centroids };
}
