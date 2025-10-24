import test from 'node:test';
import assert from 'node:assert/strict';
import { graphql } from '../src/graphql';
import { createGateway } from '../src';
import { createEnvelope } from '../../obs-mesh/src/envelope';

const gateway = createGateway();
const resolvers = gateway.createResolvers();
const schema = resolvers.getSchema();

test('correlates timelines via query', async () => {
  const event = createEnvelope({
    ts: '2024-01-01T00:00:00Z',
    source: 'audit',
    service: 'deploy',
    kind: 'audit',
    releaseId: 'rel-1',
    attrs: { action: 'deploy.create' },
  });
  gateway.publish(event);

  const result = await graphql({
    schema,
    source: `query($key: String!, $keyType: String!) { correlate(key: $key, keyType: $keyType) { key keyType timeline { source } } }`,
    variableValues: { key: 'rel-1', keyType: 'releaseId' },
    rootValue: {
      correlate: ({ key, keyType }: Record<string, unknown>) =>
        resolvers.correlate(
          { key: String(key), keyType: String(keyType) as 'traceId' | 'releaseId' | 'assetId' | 'simId' },
          { role: 'operator', scopes: [] },
        ),
    },
  });

  assert.equal(result.errors, undefined);
  const data = result.data as { correlate?: { key: string; timeline: unknown[] } };
  assert.equal(data?.correlate?.key, 'rel-1');
  assert.equal(data?.correlate?.timeline?.length, 1);
});
