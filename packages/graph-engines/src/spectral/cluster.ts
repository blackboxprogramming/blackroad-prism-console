import { createSeededRng } from '../determinism';

export function kMeansCluster(points: number[][], k: number, seed: number): number[] {
  if (points.length === 0) {
    return [];
  }
  const rng = createSeededRng(seed);
  const dims = points[0].length;
  const centroids = initialize(points, k, rng);
  const assignments = new Array(points.length).fill(0);
  for (let iter = 0; iter < 32; iter += 1) {
    let changes = 0;
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c += 1) {
        const dist = squaredDistance(point, centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changes += 1;
      }
    }
    if (changes === 0) {
      break;
    }
    const accum = Array.from({ length: k }, () => ({ sum: Array(dims).fill(0), count: 0 }));
    for (let i = 0; i < points.length; i += 1) {
      const cluster = assignments[i];
      const bucket = accum[cluster];
      bucket.count += 1;
      for (let d = 0; d < dims; d += 1) {
        bucket.sum[d] += points[i][d];
      }
    }
    for (let cluster = 0; cluster < k; cluster += 1) {
      const bucket = accum[cluster];
      if (bucket.count === 0) {
        centroids[cluster] = points[Math.floor(rng() * points.length)].slice();
      } else {
        centroids[cluster] = bucket.sum.map((value) => value / bucket.count);
      }
    }
  }
  return assignments;
}

function initialize(points: number[][], k: number, rng: () => number): number[][] {
  const chosen = new Set<number>();
  const centroids: number[][] = [];
  while (centroids.length < k) {
    const idx = Math.floor(rng() * points.length);
    if (!chosen.has(idx)) {
      centroids.push(points[idx].slice());
      chosen.add(idx);
    }
  }
  return centroids;
}

function squaredDistance(a: number[], b: number[]): number {
  return a.reduce((acc, value, index) => acc + (value - b[index]) ** 2, 0);
}
