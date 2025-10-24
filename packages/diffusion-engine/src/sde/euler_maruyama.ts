import { createDeterministicRng } from '../common/determinism.js';
import { RectGrid } from '../common/grid.js';
import { kde2D } from '../common/kde.js';
import { doubleWellPotential } from '../potential/double_well.js';
import { gaussianMixturePotential } from '../potential/gaussian_mixture.js';
import { createAnnealedScore } from '../score/annealed_score.js';
import { parseBetaSchedule } from './schedules.js';
import type { SDEConfig, SdeRunResult } from '../types.js';

type DriftFunction = (x: [number, number], step: number) => [number, number];

function parsePotential(spec?: string): (x: number, y: number) => [number, number] {
  if (!spec || spec === 'double_well') {
    return (x, y) => {
      const { grad } = doubleWellPotential(x, y);
      return [-grad[0], -grad[1]];
    };
  }
  if (spec === 'none') {
    return () => [0, 0];
  }
  if (spec.startsWith('gmix')) {
    const cfg: { components: { weight: number; mean: [number, number]; sigma: number }[] } = { components: [] };
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
    return (x, y) => {
      const { grad } = gaussianMixturePotential(x, y, cfg);
      return [-grad[0], -grad[1]];
    };
  }
  return (x, y) => {
    const { grad } = doubleWellPotential(x, y);
    return [-grad[0], -grad[1]];
  };
}

function parseScore(spec?: string): ((x: [number, number], step: number, total: number) => [number, number]) | null {
  if (!spec) return null;
  if (spec === 'annealed') {
    const score = createAnnealedScore();
    return (x, step, total) => score(x, step, total);
  }
  return null;
}

function resolveDrift(config: SDEConfig): DriftFunction {
  const potential = parsePotential(config.potential);
  const score = parseScore(config.score);
  const totalSteps = config.steps;
  if (score) {
    return (x, step) => score(x, step, totalSteps);
  }
  return (x) => potential(x[0], x[1]);
}

export function runEulerMaruyama(config: SDEConfig): SdeRunResult {
  const { particles, steps, dt, seed } = config;
  const rng = createDeterministicRng(seed);
  const state = new Float32Array(particles * 2);
  for (let i = 0; i < particles; i++) {
    const [gx, gy] = rng.gauss2();
    state[2 * i] = gx;
    state[2 * i + 1] = gy;
  }
  const drift = resolveDrift(config);
  const betaSchedule = parseBetaSchedule(config.betaSchedule ?? 'const:0.02', steps);
  const recordEvery = config.recordEvery ?? Math.max(1, Math.floor(steps / 100));
  const trajectories: Float32Array[] = [];
  const densities: Float32Array[] = [];
  const grid = config.grid ?? new RectGrid({ width: 64, height: 64, domain: 2.5 });
  const sqrtDt = Math.sqrt(dt);
  for (let step = 0; step < steps; step++) {
    const beta = betaSchedule(step * dt, step);
    const sigma = Math.sqrt(2 * beta) * sqrtDt;
    for (let i = 0; i < particles; i++) {
      const x = state[2 * i];
      const y = state[2 * i + 1];
      const [fx, fy] = drift([x, y], step);
      const [nx, ny] = rng.gauss2();
      state[2 * i] = x + fx * dt + sigma * nx;
      state[2 * i + 1] = y + fy * dt + sigma * ny;
    }
    if ((step + 1) % recordEvery === 0 || step === steps - 1) {
      trajectories.push(new Float32Array(state));
      densities.push(kde2D(state, grid));
    }
  }
  return { particles: state, trajectories, densities };
}
