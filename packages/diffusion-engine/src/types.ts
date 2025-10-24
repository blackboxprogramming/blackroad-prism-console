import type { RectGrid } from './common/grid.js';

export type BoundaryCondition = 'neumann' | 'periodic';

export interface SDEConfig {
  potential?: string;
  score?: string;
  betaSchedule?: string;
  steps: number;
  dt: number;
  particles: number;
  seed: number;
  recordEvery?: number;
  grid?: RectGrid;
}

export interface FPConfig {
  potential?: string;
  betaSchedule?: string;
  steps: number;
  dt: number;
  grid: RectGrid;
  boundary: BoundaryCondition;
  seed: number;
}

export interface SdeRunResult {
  particles: Float32Array;
  trajectories: Float32Array[];
  densities: Float32Array[];
}

export interface FpRunResult {
  densities: Float32Array[];
  massHistory: number[];
}

export interface MetricSeries {
  time: number[];
  kl: number[];
  mmd: number[];
  entropySde: number[];
  entropyFp: number[];
}

export interface ArtifactRecord {
  kind: 'frame' | 'particles' | 'metrics';
  name: string;
  data: Buffer | string | Record<string, unknown>;
}
