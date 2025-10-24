import { EmbeddingResult, PowerLloydState, PhaseFieldState, ArtifactReference, GraphData } from '@blackroad/graph-engines';

export interface JobRecord<T = unknown> {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  metrics?: Record<string, unknown>;
  artifacts: ArtifactReference[];
  payload?: T;
}

export interface SpectralPayload {
  graph: GraphData;
  result?: EmbeddingResult;
}

export interface PowerPayload {
  state?: PowerLloydState;
}

export interface PhasePayload {
  state?: PhaseFieldState;
}

const spectralJobs = new Map<string, JobRecord<SpectralPayload>>();
const powerJobs = new Map<string, JobRecord<PowerPayload>>();
const cahnJobs = new Map<string, JobRecord<PhasePayload>>();

let counter = 0;

export function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter.toString().padStart(4, '0')}`;
}

export const store = {
  spectral: spectralJobs,
  power: powerJobs,
  cahn: cahnJobs
};
