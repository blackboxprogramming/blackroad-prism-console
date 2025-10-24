import { DensityField } from '../types';
import { densityFromEmbedding } from '../powerlloyd/density';

export interface SpectralBridgeInput {
  embedding: number[][];
  scheme?: 'kde' | 'uniform';
}

export function spectralToDensity(input: SpectralBridgeInput): DensityField {
  if (input.scheme === 'uniform') {
    const width = 32;
    const height = 32;
    return { width, height, values: Array(width * height).fill(1 / (width * height)) };
  }
  const twoDimEmbedding = input.embedding.map((row) => row.slice(0, 2));
  return densityFromEmbedding(twoDimEmbedding, { width: 64, height: 64 });
import { DensityField, EmbeddingResult } from '../types';
import { gaussianDensity, normalizeDensity } from '../powerlloyd/density';

export interface SpectralToDensityOptions {
  resolution?: number;
}

export function spectralToDensity(
  result: EmbeddingResult,
  options: SpectralToDensityOptions = {}
): DensityField {
  const resolution = options.resolution ?? 64;
  const density = gaussianDensity({ width: resolution, height: resolution });
  if (result.embedding.length === 0) {
    return density;
  }
  const xs = result.embedding.map((point) => point[0]);
  const ys = result.embedding.map((point) => point[Math.min(1, point.length - 1)]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const values = new Array(resolution * resolution).fill(0);
  const bandwidth = 0.05 * (maxX - minX + maxY - minY || 1);
  result.embedding.forEach((point) => {
    const x = point[0];
    const y = point[Math.min(1, point.length - 1)];
    for (let py = 0; py < resolution; py += 1) {
      for (let px = 0; px < resolution; px += 1) {
        const nx = minX + (px / (resolution - 1 || 1)) * (maxX - minX || 1);
        const ny = minY + (py / (resolution - 1 || 1)) * (maxY - minY || 1);
        const dx = x - nx;
        const dy = y - ny;
        const weight = Math.exp(-(dx * dx + dy * dy) / (2 * bandwidth * bandwidth));
        values[py * resolution + px] += weight;
      }
    }
  });
  return normalizeDensity({ width: resolution, height: resolution, values });
}
