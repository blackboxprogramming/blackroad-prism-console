import { DensityField } from '../types';
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
