import { EconomyClientOptions, Simulation, CreateSimulationInput } from './types';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

const CREATE_MUTATION = /* GraphQL */ `
  mutation CreateSimulation($scenario: ScenarioInput!, $seed: Int) {
    simulationCreate(scenario: $scenario, seed: $seed) {
      id
      modelVersion
      seed
      status
      scenario
      startedAt
    }
  }
`;

const RUN_MUTATION = /* GraphQL */ `
  mutation RunSimulation($id: ID!) {
    simulationRun(id: $id) {
      id
      status
    }
  }
`;

const SIMULATION_QUERY = /* GraphQL */ `
  query GetSimulation($id: ID!) {
    simulation(id: $id) {
      id
      modelVersion
      seed
      status
      scenario
      startedAt
      finishedAt
      artifacts { kind url bytes hash }
      summary { finalSupply maxInflation breaches }
      evidenceHash
    }
  }
`;

export class EconomyClient {
  private readonly endpoint: string;
  private readonly token?: string;
  private readonly devToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: EconomyClientOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token;
    this.devToken = options.devToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Gateway responded with ${response.status}`);
    }

    const payload = (await response.json()) as GraphQLResponse<T>;
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join(', '));
    }
    if (!payload.data) {
      throw new Error('No data received');
    }
    return payload.data;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    if (this.devToken) {
      headers['X-Dev-Token'] = this.devToken;
    }
    return headers;
  }

  async createSimulation(input: CreateSimulationInput): Promise<Simulation> {
    const data = await this.request<{ simulationCreate: Simulation }>(CREATE_MUTATION, {
      scenario: input.scenario,
      seed: input.seed ?? null
    });
    return data.simulationCreate;
  }

  async runSimulation(id: string): Promise<Simulation> {
    const data = await this.request<{ simulationRun: Simulation }>(RUN_MUTATION, { id });
    return data.simulationRun;
  }

  async getSimulation(id: string): Promise<Simulation | null> {
    const data = await this.request<{ simulation: Simulation | null }>(SIMULATION_QUERY, { id });
    return data.simulation;
  }

  async *subscribeSimulationEvents(id: string, intervalMs = 1000): AsyncGenerator<Simulation, void, void> {
    let lastStatus: string | undefined;
    while (true) {
      const simulation = await this.getSimulation(id);
      if (!simulation) {
        return;
      }
      if (simulation.status !== lastStatus) {
        lastStatus = simulation.status;
        yield simulation;
      }
      if (simulation.status === 'COMPLETED' || simulation.status === 'FAILED') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

export default EconomyClient;
