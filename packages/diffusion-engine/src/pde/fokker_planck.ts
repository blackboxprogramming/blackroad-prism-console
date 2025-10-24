import { RectGrid } from '../common/grid.js';
import { doubleWellPotential } from '../potential/double_well.js';
import { gaussianMixturePotential, type GaussianMixtureConfig } from '../potential/gaussian_mixture.js';
import { parseBetaSchedule } from '../sde/schedules.js';
import { enforceBoundary } from './boundaries.js';
import type { FPConfig, FpRunResult } from '../types.js';

interface PotentialGradient {
  (x: number, y: number): [number, number];
}

function resolvePotential(spec?: string): PotentialGradient {
  if (!spec || spec === 'double_well') {
    return (x, y) => doubleWellPotential(x, y).grad;
  }
  if (spec === 'none') {
    return () => [0, 0];
  }
  if (spec.startsWith('gmix')) {
    const cfg: GaussianMixtureConfig = { components: [] };
    const parts = spec.slice('gmix:'.length).split(';');
    let weights: number[] | null = null;
    let means: number[] | null = null;
    let sigmas: number[] | null = null;
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (!key || !value) continue;
      const arr = value
        .trim()
        .replace(/^[\[]|[\]]$/g, '')
        .split(',')
        .map((v) => parseFloat(v.trim()))
        .filter((v) => Number.isFinite(v));
      if (key === 'w' || key === 'weights') weights = arr;
      if (key === 'mu' || key === 'mean') means = arr;
      if (key === 'sigma') sigmas = arr;
    }
    const count = Math.max(weights?.length ?? 0, (means?.length ?? 0) / 2, sigmas?.length ?? 0);
    for (let i = 0; i < count; i++) {
      const weight = weights?.[i] ?? 1 / count;
      const mean: [number, number] = [means?.[2 * i] ?? 0, means?.[2 * i + 1] ?? 0];
      const sigma = sigmas?.[i] ?? 0.6;
      cfg.components.push({ weight, mean, sigma });
    }
    return (x, y) => gaussianMixturePotential(x, y, cfg).grad;
  }
  return (x, y) => doubleWellPotential(x, y).grad;
}

function computeInitialDensity(grid: RectGrid): Float32Array {
  const density = new Float32Array(grid.width * grid.height);
  const sigma2 = 1.2 * 1.2;
  grid.forEach((i, j, x, y) => {
    const idx = grid.index(i, j);
    density[idx] = Math.exp(-(x * x + y * y) / (2 * sigma2));
  });
  normaliseDensity(grid, density);
  return density;
}

function normaliseDensity(grid: RectGrid, density: Float32Array): void {
  let sum = 0;
  for (const value of density) {
    sum += value;
  }
  const scale = sum > 0 ? 1 / (sum * grid.dx * grid.dy) : 0;
  if (scale !== 0) {
    for (let i = 0; i < density.length; i++) {
      density[i] *= scale;
    }
  }
}

function applyLaplacian(
  grid: RectGrid,
  field: Float32Array,
  out: Float32Array,
  boundary: FPConfig['boundary']
): void {
  const working = Float32Array.from(field);
  enforceBoundary(grid, working, boundary);
  const { width, height, dx, dy } = grid;
  const idx = (i: number, j: number) => grid.index(i, j);
  const invDx2 = 1 / (dx * dx);
  const invDy2 = 1 / (dy * dy);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const center = working[idx(i, j)];
      const left = working[idx(i === 0 ? 0 : i - 1, j)];
      const right = working[idx(i === width - 1 ? width - 1 : i + 1, j)];
      const down = working[idx(i, j === 0 ? 0 : j - 1)];
      const up = working[idx(i, j === height - 1 ? height - 1 : j + 1)];
      out[idx(i, j)] = (left - 2 * center + right) * invDx2 + (down - 2 * center + up) * invDy2;
    }
  }
}

function applyHelmholtz(
  grid: RectGrid,
  field: Float32Array,
  alpha: number,
  boundary: FPConfig['boundary'],
  out: Float32Array,
  scratch: Float32Array
): void {
  applyLaplacian(grid, field, scratch, boundary);
  for (let i = 0; i < out.length; i++) {
    out[i] = field[i] - alpha * scratch[i];
  }
}

function conjugateGradient(
  grid: RectGrid,
  alpha: number,
  boundary: FPConfig['boundary'],
  rhs: Float32Array,
  initial: Float32Array,
  scratch: Float32Array,
  maxIter = 200,
  tol = 1e-6
): Float32Array {
  const x = Float32Array.from(initial);
  const r = new Float32Array(rhs.length);
  const p = new Float32Array(rhs.length);
  const Ap = new Float32Array(rhs.length);
  applyHelmholtz(grid, x, alpha, boundary, Ap, scratch);
  for (let i = 0; i < rhs.length; i++) {
    r[i] = rhs[i] - Ap[i];
    p[i] = r[i];
  }
  let rsold = dot(r, r);
  if (Math.sqrt(rsold) < tol) {
    return x;
  }
  for (let iter = 0; iter < maxIter; iter++) {
    applyHelmholtz(grid, p, alpha, boundary, Ap, scratch);
    const alphaK = rsold / Math.max(dot(p, Ap), 1e-12);
    for (let i = 0; i < x.length; i++) {
      x[i] += alphaK * p[i];
      r[i] -= alphaK * Ap[i];
    }
    const rsnew = dot(r, r);
    if (Math.sqrt(rsnew) < tol) {
      break;
    }
    const beta = rsnew / Math.max(rsold, 1e-12);
    for (let i = 0; i < p.length; i++) {
      p[i] = r[i] + beta * p[i];
    }
    rsold = rsnew;
  }
  enforceBoundary(grid, x, boundary);
  return x;
}

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function runFokkerPlanck(config: FPConfig): FpRunResult {
  const grid = config.grid ?? new RectGrid({ width: 64, height: 64, domain: 2.5 });
  const density = computeInitialDensity(grid);
  const potential = resolvePotential(config.potential);
  const betaSchedule = parseBetaSchedule(config.betaSchedule ?? 'const:0.02', config.steps);
  const recordEvery = Math.max(1, Math.floor(config.steps / 100));
  const scratch = new Float32Array(grid.width * grid.height);
  const temp = new Float32Array(grid.width * grid.height);
  const rhs = new Float32Array(grid.width * grid.height);
  const fluxX = new Float32Array(grid.width * grid.height);
  const fluxY = new Float32Array(grid.width * grid.height);
  const densities: Float32Array[] = [];
  const massHistory: number[] = [];
  const idx = (i: number, j: number) => grid.index(i, j);

  for (let step = 0; step < config.steps; step++) {
    grid.forEach((i, j, x, y) => {
      const g = potential(x, y);
      const id = idx(i, j);
      fluxX[id] = density[id] * g[0];
      fluxY[id] = density[id] * g[1];
    });
    enforceBoundary(grid, fluxX, config.boundary);
    enforceBoundary(grid, fluxY, config.boundary);
    const { width, height, dx, dy } = grid;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const id = idx(i, j);
        const left = fluxX[idx(i === 0 ? 0 : i - 1, j)];
        const right = fluxX[idx(i === width - 1 ? width - 1 : i + 1, j)];
        const down = fluxY[idx(i, j === 0 ? 0 : j - 1)];
        const up = fluxY[idx(i, j === height - 1 ? height - 1 : j + 1)];
        const div = (right - left) / (2 * dx) + (up - down) / (2 * dy);
        rhs[id] = density[id] - config.dt * div;
      }
    }
    const beta = betaSchedule(step * config.dt, step);
    const alpha = config.dt * beta;
    const next = conjugateGradient(grid, alpha, config.boundary, rhs, density, scratch, 150, 1e-6);
    next.forEach((v, k) => {
      temp[k] = Math.max(v, 0);
    });
    normaliseDensity(grid, temp);
    density.set(temp);
    if ((step + 1) % recordEvery === 0 || step === config.steps - 1) {
      densities.push(Float32Array.from(density));
    }
    let mass = 0;
    for (const value of density) {
      mass += value;
    }
    massHistory.push(mass * grid.dx * grid.dy);
  }

  return { densities, massHistory };
}
