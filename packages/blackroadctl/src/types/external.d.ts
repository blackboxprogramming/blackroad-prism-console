declare module '@blackroad/control-plane-sdk' {
  export interface AuditEvent {
    action: string;
    actor: string;
    ts: string;
    subjectType: string;
    subjectId: string;
    metadata?: Record<string, unknown>;
  }

  export interface Release {
    id: string;
    envId: string;
    version?: string;
    sha?: string;
    status: string;
  }

  export interface Incident {
    id: string;
    severity: string;
    status: string;
    startedAt: string;
    link?: string | null;
  }

  export interface Environment {
    id: string;
    name: string;
  }

  export interface Service {
    id: string;
    name: string;
    repo?: string | null;
    environments: Environment[];
  }

  export interface DeployCreateInput {
    serviceId: string;
    envId: string;
    sha: string;
  }

  export interface DeployPromoteInput {
    releaseId: string;
    toEnvId: string;
  }

  export default class ControlPlaneClient {
    constructor(options: { endpoint: string; token?: string; devToken?: string });
    deployCreate(input: DeployCreateInput): Promise<{ audit: AuditEvent }>;
    deployPromote(input: DeployPromoteInput): Promise<{ audit: AuditEvent }>;
    serviceStatus(serviceId: string): Promise<{ service: Service; releases: Release[] }>;
    recentIncidents(serviceId: string, limit?: number): Promise<{ incidents: Incident[] }>;
  }
}

declare module '@blackroad/economy-sdk' {
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

  export default class EconomyClient {
    constructor(options: EconomyClientOptions);
    createSimulation(input: CreateSimulationInput): Promise<Simulation>;
    runSimulation(id: string): Promise<Simulation>;
    getSimulation(id: string): Promise<Simulation | null>;
    subscribeSimulationEvents(id: string, intervalMs?: number): AsyncGenerator<Simulation, void, void>;
  }

  export type { SimulationArtifact };
}
