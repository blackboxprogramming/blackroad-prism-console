export interface Edge {
  source: number;
  target: number;
  weight?: number;
}

export interface GraphData {
  nodes: number;
  edges: Edge[];
}

export interface SpectralOptions {
  k: number;
  seed?: number;
  maxIterations?: number;
  tolerance?: number;
}

export interface SpectralEmbedding {
  eigenvalues: number[];
  embedding: number[][];
  clusters: number[];
  metrics: {
    eigengap: number[];
    conductance: number[];
    modularity: number;
  };
}

export interface DensityField {
  width: number;
  height: number;
  values: number[];
}

export interface PowerLloydSite {
  position: [number, number];
  weight: number;
  targetMass?: number;
}

export interface PowerLloydOptions {
  iterations: number;
  massTolerance: number;
  movementTolerance: number;
  seed?: number;
}

export interface PowerLloydResult {
  sites: PowerLloydSite[];
  history: number[];
  massErrors: number[];
}

export interface PhaseField {
  width: number;
  height: number;
  values: number[];
}

export interface CahnHilliardOptions {
  epsilon: number;
  dt: number;
  steps: number;
  recordEvery?: number;
}

export interface CahnHilliardResult {
  frames: PhaseField[];
  residuals: number[];
  mass: number;
}

export interface ArtifactRecord {
  path: string;
  description: string;
}
