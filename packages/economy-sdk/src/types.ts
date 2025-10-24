export interface SimulationArtifact {
  kind: string;
  url: string;
  bytes: number;
  hash: string;
}

export interface SimulationSummary {
  finalSupply: number;
  maxInflation: number;
  breaches: string[];
}

export interface Simulation {
  id: string;
  modelVersion: string;
  seed: number;
  scenario: Record<string, unknown>;
  status: string;
  startedAt: string;
  finishedAt?: string;
  artifacts: SimulationArtifact[];
  summary: SimulationSummary;
  evidenceHash?: string;
}

export interface CreateSimulationInput {
  scenario: Record<string, unknown>;
  seed?: number;
}

export interface EconomyClientOptions {
  endpoint: string;
  token?: string;
  devToken?: string;
  fetchImpl?: typeof fetch;
}
