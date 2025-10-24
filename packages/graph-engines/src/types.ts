export interface Edge {
  source: number;
  target: number;
  weight?: number;
}

export interface GraphData {
  nodeCount: number;
  edges: Edge[];
  features?: number[][];
}

export interface EmbeddingResult {
  eigenvalues: number[];
  eigenvectors: number[][];
  embedding: number[][];
  clusters: number[];
  metrics: SpectralMetrics;
  artifacts: ArtifactReference[];
}

export interface SpectralMetrics {
  eigengap: number[];
  conductance: number[];
  modularity: number;
}

export interface ArtifactReference {
  id: string;
  type: 'png' | 'csv' | 'json' | 'webm';
  path: string;
  sha256: string;
  description: string;
}

export interface DensityField {
  width: number;
  height: number;
  values: number[];
}

export interface PowerLloydState {
  points: { x: number; y: number; weight: number }[];
  iteration: number;
  movement: number;
  massError: number;
  cells: Uint16Array;
  density: DensityField;
  metrics: {
    movementHistory: number[];
    massErrorHistory: number[];
  };
  artifacts: ArtifactReference[];
}

export interface PhaseFieldState {
  grid: DensityField;
  frames: DensityField[];
  residuals: number[];
  artifacts: ArtifactReference[];
}
