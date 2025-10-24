import { DensityField } from '../types';

export interface DensityFromEmbeddingOptions {
  width?: number;
  height?: number;
  bandwidth?: number;
}

export function densityFromEmbedding(points: number[][], options: DensityFromEmbeddingOptions = {}): DensityField {
  const width = options.width ?? 64;
  const height = options.height ?? 64;
  const bandwidth = options.bandwidth ?? 0.2;

  if (points.length === 0) {
    return { width, height, values: Array(width * height).fill(1 / (width * height)) };
  }

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const values = new Array(width * height).fill(0);
  const norm = 1 / (2 * Math.PI * bandwidth * bandwidth);
  for (let iy = 0; iy < height; iy += 1) {
    for (let ix = 0; ix < width; ix += 1) {
      const x = minX + (ix / (width - 1)) * rangeX;
      const y = minY + (iy / (height - 1)) * rangeY;
      let density = 0;
      for (const point of points) {
        const dx = point[0] - x;
        const dy = point[1] - y;
        const dist = (dx * dx + dy * dy) / (2 * bandwidth * bandwidth);
        density += norm * Math.exp(-dist);
      }
      values[iy * width + ix] = density;
    }
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return { width, height, values: values.map((value) => value / total) };
}
