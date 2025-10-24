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
}
