const { ensureGatewayBuilt } = require('./helpers/build');
const { graphql } = require('graphql');

beforeAll(() => {
  ensureGatewayBuilt();
});

const { createGraphGatewaySchema } = require('../dist');

describe('Graph Gateway schema', () => {
  it('exposes spectralRun mutation', async () => {
    const schema = createGraphGatewaySchema();
    const result = await graphql({
      schema,
      source: 'mutation { __typename }',
      contextValue: { role: 'admin' }
    });
    expect(result.errors).toBeUndefined();
  });
});
