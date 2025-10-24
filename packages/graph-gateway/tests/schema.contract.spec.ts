import { graphql } from 'graphql';
import { createSchema } from '../src/schema';
import { store } from '../src/resolvers/store';

describe('graph-gateway schema', () => {
  beforeEach(() => {
    store.spectral.clear();
    store.power.clear();
    store.cahn.clear();
  });

  it('runs spectral pipeline end to end', async () => {
    const schema = createSchema();
    const edgeList = '0 1\n1 2\n2 3\n3 0';
    const run = await graphql({
      schema,
      source: `mutation($edgeList: String!) {
        spectralRun(edgeList: $edgeList, k: 2) {
          id
          status
          metrics
        }
      }`,
      variableValues: { edgeList }
    });
    expect(run.errors).toBeUndefined();
    const id = (run.data as any).spectralRun.id;
    const query = await graphql({
      schema,
      source: `query($id: ID!) {
        spectralJob(id: $id) { status }
      }`,
      variableValues: { id }
    });
    expect(query.errors).toBeUndefined();
    expect((query.data as any).spectralJob.status).toBe('completed');
  });
});
