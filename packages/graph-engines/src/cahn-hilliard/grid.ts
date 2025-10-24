import { DensityField } from '../types';
import { createSeededRng } from '../determinism';

export interface GridOptions {
  width: number;
  height: number;
  initial?: (x: number, y: number) => number;
  seed?: number;
}

export function createGrid(options: GridOptions): DensityField {
  const rng = createSeededRng(options.seed ?? 7);
  const values: number[] = [];
  for (let y = 0; y < options.height; y += 1) {
    for (let x = 0; x < options.width; x += 1) {
      if (options.initial) {
        values.push(options.initial(x, y));
      } else {
        const value = rng() * 2 - 1;
        values.push(value);
      }
    }
  }
  return { width: options.width, height: options.height, values };
}

export function cloneField(field: DensityField): DensityField {
  return { width: field.width, height: field.height, values: field.values.slice() };
}

export function laplacian(field: DensityField, x: number, y: number): number {
  const { width, height } = field;
  const idx = y * width + x;
  const center = field.values[idx];
  const left = field.values[y * width + ((x - 1 + width) % width)];
  const right = field.values[y * width + ((x + 1) % width)];
  const up = field.values[((y - 1 + height) % height) * width + x];
  const down = field.values[((y + 1) % height) * width + x];
  return left + right + up + down - 4 * center;
}

export function mean(field: DensityField): number {
  return field.values.reduce((acc, value) => acc + value, 0) / field.values.length;
}
