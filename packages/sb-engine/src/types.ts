export type Vector = Float64Array;
export type Matrix = Float64Array;

export interface Distribution {
  points: Float64Array[] | number[][];
  weights: Vector;
}

export type CostMetric = 'l2' | 'cosine' | 'tv_l1';

export interface CostMatrixOptions {
  metric?: CostMetric;
  tileSize?: number;
  cosineNormalize?: boolean;
}

export interface SinkhornConfig {
  epsilon: number;
  maxIterations?: number;
  tolerance?: number;
  warmStart?: {
    logU?: Vector;
    logV?: Vector;
  };
  clamp?: number;
  checkInterval?: number;
}

export interface SinkhornIterate {
  iteration: number;
  marginalError: number;
  dualGap: number;
}

export interface SinkhornResult {
  u: Vector;
  v: Vector;
  logU: Vector;
  logV: Vector;
  coupling: Matrix;
  iterations: number;
  converged: boolean;
  history: SinkhornIterate[];
}

export interface Diagnostics {
  marginalError: number;
  cost: number;
  kl: number;
  primal: number;
  dual: number;
}

export interface ArtifactPaths {
  directory: string;
  piPath: string;
  mapPath: string;
  diagnosticsPath: string;
  framesPath: string;
}

export interface BarycentricMap {
  map: number[][];
  weights: Vector;
}
