import { execute, subscribe, parse } from 'graphql';
import { schema } from '../src/schema';
import { createContext } from '../src/resolvers/simulation';

function mockRequest(role?: string): any {
  return {
    headers: {
      get: (key: string) => {
        if (!role) return null;
        return key.toLowerCase() === 'x-role' ? role : null;
      }
    }
  } as any;
}

const scenario = {
  kind: 'linear',
  startDate: '2025-01-01',
  horizonMonths: 3,
  params: {
    initialSupply: 1000000,
    emissionPerMonth: 20000,
    maxSupply: 1100000
  }
};

describe('economy gateway schema', () => {
  it('creates and runs a simulation', async () => {
    const createResult = await execute({
      schema,
      document: parse(/* GraphQL */ `
        mutation($scenario: ScenarioInput!, $seed: Int) {
          simulationCreate(scenario: $scenario, seed: $seed) {
            id
            status
            modelVersion
          }
        }
      `),
      variableValues: { scenario, seed: 5 },
      contextValue: createContext({ request: mockRequest('operator') })
    });

    if (!('data' in createResult) || !createResult.data) {
      throw new Error('No data returned from create');
    }

    const id = (createResult.data as any).simulationCreate.id as string;

    const runResult = await execute({
      schema,
      document: parse(/* GraphQL */ `
        mutation($id: ID!) {
          simulationRun(id: $id) {
            id
            status
          }
        }
      `),
      variableValues: { id },
      contextValue: createContext({ request: mockRequest('operator') })
    });

    expect(runResult).toBeDefined();
  });

  it('streams events', async () => {
    const iterator = await subscribe({
      schema,
      document: parse(/* GraphQL */ `
        subscription($id: ID) {
          simulationEvents(id: $id) {
            id
            status
          }
        }
      `),
      variableValues: { id: null },
      contextValue: createContext({ request: mockRequest() })
    });

    if (!('next' in iterator)) {
      throw new Error('Subscription did not return async iterator');
    }

    const next = await iterator.next();
    expect(next.value).toBeDefined();
  });
});
