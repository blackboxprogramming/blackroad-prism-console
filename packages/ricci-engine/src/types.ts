export type EdgeId = string;

export interface WeightedEdge {
  id: EdgeId;
  source: number;
  target: number;
  weight: number;
}

export interface WeightedGraph {
  nodeCount: number;
  edges: WeightedEdge[];
}

export type CurvatureEngine = 'forman' | 'ollivier';

export interface CurvatureMetrics {
  averageKappa: number;
  negativeRatio: number;
  sinkhornIterations?: number;
}

export interface CurvatureResult {
  values: Map<EdgeId, number>;
  metrics: CurvatureMetrics;
}

export interface OllivierConfig {
  sinkhornEps: number;
  sinkhornIters: number;
  tolerance?: number;
}

export interface RicciFlowConfig {
  curvature: CurvatureEngine;
  tau: number;
  iterations: number;
  epsilonW: number;
  targetKappa?: number;
  sinkhorn?: OllivierConfig;
  minTau?: number;
  renormalize?: boolean;
}

export interface RicciFlowStep {
  iteration: number;
  tau: number;
  curvature: CurvatureResult;
  weights: Map<EdgeId, number>;
  stress: number;
  backtracks: number;
}

export interface RicciFlowResult {
  steps: RicciFlowStep[];
  finalWeights: Map<EdgeId, number>;
  finalCurvature: CurvatureResult;
}

export interface StressSeriesPoint {
  iteration: number;
  stress: number;
}

export interface LayoutResult {
  embedding: number[][];
  stress: number;
  method: 'mds' | 'spectral' | 'powerlloyd';
}

export interface ArtifactContext {
  directory: string;
  graph: WeightedGraph;
  curvature: CurvatureResult;
  weights: Map<EdgeId, number>;
  embedding: number[][];
  stressHistory: StressSeriesPoint[];
}

export interface ArtifactRecord {
  path: string;
  description: string;
}
