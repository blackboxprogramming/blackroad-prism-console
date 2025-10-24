import { graphql } from 'graphql';
import { createGateway } from '../src/index.js';

describe('HJB Gateway schema', () => {
  it('executes PDE, MDP, and rollout operations', async () => {
    const { schema, rootValue } = createGateway();
    const context = { role: 'operator' as const };

    const pdeConfig = {
      grid: { shape: [5], spacing: [0.5], origin: [-1] },
      dynamics: { type: 'single_integrator', options: { dimension: 1, controlLimit: 1.5 } },
      cost: { type: 'quadratic', stateWeights: [1], controlWeights: [1] },
      tolerance: 1e-2,
      damping: 0.2
    };

    const pdeResult = await graphql({
      schema,
      source: 'mutation($config: JSON!){ hjbSolvePDE(config:$config){ id status metrics }}',
      variableValues: { config: pdeConfig },
      rootValue,
      contextValue: context
    });
    expect(pdeResult.errors).toBeUndefined();
    const pdeJobId = (pdeResult.data as any).hjbSolvePDE.id;

    const jobQuery = await graphql({
      schema,
      source: 'query($id: ID!){ hjbJob(id:$id){ id status artifacts { name path } }}',
      variableValues: { id: pdeJobId },
      rootValue,
      contextValue: { role: 'viewer' }
    });
    expect(jobQuery.errors).toBeUndefined();
    expect((jobQuery.data as any).hjbJob.artifacts.length).toBeGreaterThan(0);

    const rolloutResult = await graphql({
      schema,
      source: 'mutation($jobId: ID!, $start: [Float!]!){ hjbRollout(jobId:$jobId, start:$start){ name path }}',
      variableValues: { jobId: pdeJobId, start: [0] },
      rootValue,
      contextValue: context
    });
    expect(rolloutResult.errors).toBeUndefined();

    const mdpConfig = {
      grid: { shape: [3], spacing: [1], origin: [-1] },
      dynamics: { type: 'single_integrator', options: { dimension: 1, controlLimit: 1 } },
      cost: { type: 'quadratic', stateWeights: [1], controlWeights: [1] },
      discount: 0.9,
      dt: 0.1,
      controlResolution: 0.5
    };

    const mdpResult = await graphql({
      schema,
      source: 'mutation($config: JSON!){ hjbSolveMDP(config:$config){ id status metrics }}',
      variableValues: { config: mdpConfig },
      rootValue,
      contextValue: context
    });
    expect(mdpResult.errors).toBeUndefined();
    expect((mdpResult.data as any).hjbSolveMDP.status).toBe('COMPLETED');
  });
});
