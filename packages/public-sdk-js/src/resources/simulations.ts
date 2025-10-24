import type { JsonFetcher } from './client.js';

export interface SimulationRun {
  simulationId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  submittedAt?: string;
  artifacts?: SimulationArtifact[];
}

export interface SimulationArtifact {
  kind: string;
  url: string;
  mimeType: string;
}

export interface RunSimulationInput {
  scenario: 'cashflow' | 'adoption' | 'reward_curve';
  parameters: Record<string, unknown>;
  seed?: number;
}

export class SimulationsResource {
  constructor(private readonly fetcher: JsonFetcher) {}

  create(input: RunSimulationInput): Promise<{ simulationId: string; status: string }> {
    return this.fetcher('/v1/simulations', {
      method: 'POST',
      body: JSON.stringify(input),
    }) as Promise<{ simulationId: string; status: string }>;
  }

  get(simulationId: string): Promise<SimulationRun> {
    return this.fetcher(`/v1/simulations/${simulationId}`) as Promise<SimulationRun>;
  }

  listArtifacts(simulationId: string): Promise<{ simulationId: string; artifacts: SimulationArtifact[] }> {
    return this.fetcher(`/v1/simulations/${simulationId}/artifacts`) as Promise<{
      simulationId: string;
      artifacts: SimulationArtifact[];
    }>;
  }
}
