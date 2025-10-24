import { PhaseField } from '../types';

export function createPhaseField(width: number, height: number, value = 0): PhaseField {
  return { width, height, values: Array(width * height).fill(value) };
}

export function clonePhaseField(field: PhaseField): PhaseField {
  return { width: field.width, height: field.height, values: [...field.values] };
}

export function laplacian(field: PhaseField): number[] {
  const result = new Array(field.values.length).fill(0);
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const idx = y * field.width + x;
      const center = field.values[idx];
      const left = field.values[y * field.width + ((x - 1 + field.width) % field.width)];
      const right = field.values[y * field.width + ((x + 1) % field.width)];
      const up = field.values[((y - 1 + field.height) % field.height) * field.width + x];
      const down = field.values[((y + 1) % field.height) * field.width + x];
      result[idx] = left + right + up + down - 4 * center;
    }
  }
  return result;
}

export function addScaled(
  base: number[],
  increment: number[],
  scale: number
): number[] {
  return base.map((value, idx) => value + increment[idx] * scale);
}

export function subtractMean(values: number[]): void {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  for (let i = 0; i < values.length; i += 1) {
    values[i] -= mean;
  }
}
