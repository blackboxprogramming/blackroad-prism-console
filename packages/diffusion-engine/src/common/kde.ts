import { RectGrid } from './grid.js';

type ParticleArray = Float32Array | number[];

export interface KdeOptions {
  bandwidth?: number;
}

export function kde2D(
  particles: ParticleArray,
  grid: RectGrid,
  opts: KdeOptions = {}
): Float32Array {
  const bandwidth = opts.bandwidth ?? Math.max(grid.dx, grid.dy) * 1.5;
  const bw2 = bandwidth * bandwidth;
  const norm = 1 / (2 * Math.PI * bw2);
  const density = new Float32Array(grid.width * grid.height);
  const n = Math.floor(particles.length / 2);
  for (let idx = 0; idx < n; idx++) {
    const px = particles[2 * idx];
    const py = particles[2 * idx + 1];
    for (let j = 0; j < grid.height; j++) {
      const dy = grid.y[j] - py;
      for (let i = 0; i < grid.width; i++) {
        const dx = grid.x[i] - px;
        const g = norm * Math.exp(-(dx * dx + dy * dy) / (2 * bw2));
        density[grid.index(i, j)] += g;
      }
    }
  }
  let sum = 0;
  for (const value of density) {
    sum += value;
  }
  if (sum > 0) {
    for (let i = 0; i < density.length; i++) {
      density[i] /= sum * grid.dx * grid.dy;
    }
  }
  return density;
}
