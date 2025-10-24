import { createYoga } from '@graphql-yoga/node';
import { typeDefs } from '../src/schema';
import { resolvers } from '../src/resolvers';
import { ControlPlaneStore } from '../src/store';
import { AuditBus } from '../src/audit/bus';

const mutation = `
  mutation DeployCreate($serviceId: ID!, $envId: ID!, $sha: String!) {
    deployCreate(serviceId: $serviceId, envId: $envId, sha: $sha) {
      release { id status }
      audit { action }
    }
  }
`;

describe('control-plane schema', () => {
  it('creates a release via deployCreate mutation', async () => {
    const store = new ControlPlaneStore();
    await store.load();
    store.upsertEnvironment({ id: 'env-test', name: 'staging' });
    store.upsertService({
      id: 'svc-test',
      name: 'Test Service',
      repo: 'github.com/example/test',
      adapters: { deployments: ['aws'] },
      environments: [{ id: 'env-test', name: 'staging' }]
    });

    const yoga = createYoga({
      schema: { typeDefs, resolvers },
      context: () => ({ store, audit: new AuditBus(), principal: { id: 'tester', roles: ['deployer', 'operator', 'viewer'] } })
    });

    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables: { serviceId: 'svc-test', envId: 'env-test', sha: 'abc123' } })
    });

    const payload = await response.json();
    expect(payload.errors).toBeUndefined();
    expect(payload.data.deployCreate.release.status).toBe('Active');
    expect(payload.data.deployCreate.audit.action).toBe('deploy.create');
  });
});
