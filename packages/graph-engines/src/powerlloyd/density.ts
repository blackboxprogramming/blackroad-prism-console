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
import { createSeededRng } from '../determinism';

export interface DensityOptions {
  width: number;
  height: number;
  seed?: number;
}

export function gaussianDensity(options: DensityOptions): DensityField {
  const rng = createSeededRng(options.seed ?? 7);
  const values: number[] = [];
  const cx = 0.5 + (rng() - 0.5) * 0.2;
  const cy = 0.5 + (rng() - 0.5) * 0.2;
  const sigma = 0.15 + rng() * 0.05;
  for (let y = 0; y < options.height; y += 1) {
    const ny = y / (options.height - 1 || 1);
    for (let x = 0; x < options.width; x += 1) {
      const nx = x / (options.width - 1 || 1);
      const dx = nx - cx;
      const dy = ny - cy;
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      values.push(value);
    }
  }
  const max = Math.max(...values);
  const normalized = values.map((value) => value / (max || 1));
  return { width: options.width, height: options.height, values: normalized };
}

export function normalizeDensity(field: DensityField): DensityField {
  const sum = field.values.reduce((acc, value) => acc + value, 0);
  if (sum === 0) {
    return field;
  }
  return {
    width: field.width,
    height: field.height,
    values: field.values.map((value) => value / sum)
  };
}
