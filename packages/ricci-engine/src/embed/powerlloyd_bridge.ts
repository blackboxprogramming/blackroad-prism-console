import { fixedRng } from '../determinism';

export interface DensityField {
  width: number;
  height: number;
  values: number[];
}

export interface PowerLloydSite {
  position: [number, number];
  weight: number;
}

export interface PowerLloydBridgeResult {
  density: DensityField;
  sites: PowerLloydSite[];
}

function normalizeEmbedding(embedding: number[][]): number[][] {
  if (embedding.length === 0) {
    return embedding;
  }
  const dims = embedding[0].length;
  const min = new Array(dims).fill(Number.POSITIVE_INFINITY);
  const max = new Array(dims).fill(Number.NEGATIVE_INFINITY);
  for (const point of embedding) {
    for (let i = 0; i < dims; i += 1) {
      min[i] = Math.min(min[i], point[i]);
      max[i] = Math.max(max[i], point[i]);
    }
  }
  return embedding.map((point) =>
    point.map((value, dim) => {
      const range = max[dim] - min[dim] || 1;
      return (value - min[dim]) / range;
    })
  );
}

export function bridgeToPowerLloyd(embedding: number[][], resolution = 32, siteCount = 16): PowerLloydBridgeResult {
  const normalized = normalizeEmbedding(embedding);
  const width = resolution;
  const height = resolution;
  const values = new Array(width * height).fill(0);
  for (const point of normalized) {
    const x = Math.min(width - 1, Math.max(0, Math.floor(point[0] * (width - 1))));
    const y = Math.min(height - 1, Math.max(0, Math.floor((point[1] ?? 0.5) * (height - 1))));
    values[y * width + x] += 1;
  }
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  for (let i = 0; i < values.length; i += 1) {
    values[i] /= total;
  }
  const rng = fixedRng(embedding.length + resolution * 13);
  const sites: PowerLloydSite[] = [];
  for (let i = 0; i < siteCount; i += 1) {
    const angle = (2 * Math.PI * i) / siteCount;
    const jitter = 0.05 * (rng.next() - 0.5);
    const radius = 0.35 + 0.1 * (rng.next() - 0.5);
    sites.push({
      position: [0.5 + radius * Math.cos(angle) + jitter, 0.5 + radius * Math.sin(angle) + jitter],
      weight: 1 / siteCount
    });
  }
  return {
    density: { width, height, values },
    sites
  };
}
