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
}
