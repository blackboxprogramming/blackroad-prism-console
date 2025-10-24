import { mulberry32, shuffleInPlace } from '../determinism';

export function kMeans(data: number[][], k: number, seed = 7, maxIterations = 100): { labels: number[]; centroids: number[][] } {
  if (data.length === 0) {
    return { labels: [], centroids: [] };
  }
  const random = mulberry32(seed);
  const indices = data.map((_, idx) => idx);
  shuffleInPlace(indices, random);
  const centroids = indices.slice(0, k).map((index) => [...data[index]]);
  const labels = Array(data.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    let moved = false;
    for (let i = 0; i < data.length; i += 1) {
      let bestIdx = 0;
      let bestDistance = Infinity;
      for (let c = 0; c < k; c += 1) {
        const distance = squaredDistance(data[i], centroids[c]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIdx = c;
        }
      }
      if (labels[i] !== bestIdx) {
        labels[i] = bestIdx;
        moved = true;
      }
    }

    const sums = Array.from({ length: k }, () => Array(data[0].length).fill(0));
    const counts = Array(k).fill(0);
    for (let i = 0; i < data.length; i += 1) {
      const label = labels[i];
      counts[label] += 1;
      for (let d = 0; d < data[i].length; d += 1) {
        sums[label][d] += data[i][d];
      }
    }

    for (let c = 0; c < k; c += 1) {
      if (counts[c] === 0) {
        centroids[c] = [...data[Math.floor(random() * data.length)]];
      } else {
        centroids[c] = sums[c].map((value) => value / counts[c]);
      }
    }

    if (!moved) {
      break;
    }
  }

  return { labels, centroids };
}

export function squaredDistance(a: number[], b: number[]): number {
  return a.reduce((acc, value, idx) => acc + (value - b[idx]) * (value - b[idx]), 0);
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
