import { DensityField } from '../types';

export interface LayoutBridgeOptions {
  alpha?: number;
}

export function layoutToPhase(
  cells: Uint16Array,
  layout: { width: number; height: number },
  options: LayoutBridgeOptions = {}
): DensityField {
  const alpha = options.alpha ?? 0.5;
  const values: number[] = [];
  const clusters = new Set<number>();
  cells.forEach((value) => clusters.add(value));
  const palette = Array.from(clusters.values()).sort((a, b) => a - b);
  for (let i = 0; i < cells.length; i += 1) {
    const idx = palette.indexOf(cells[i]);
    const normalized = (idx / Math.max(1, palette.length - 1)) * 2 - 1;
    values.push(alpha * normalized);
  }
  return { width: layout.width, height: layout.height, values };
}
