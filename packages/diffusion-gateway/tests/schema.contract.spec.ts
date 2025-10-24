import { graphql } from 'graphql';
import { schema } from '../src/index.js';
import type { RequestContext } from '../src/auth/rbac.js';

describe('Diffusion gateway schema', () => {
  it('runs SDE and FP jobs then compares them', async () => {
    const ctx: RequestContext = { role: 'operator' };
    const sdeResult = await graphql({
      schema,
      source: `mutation Run($cfg: SDEConfig!) {
        diffusionRunSDE(cfg: $cfg) { id mode status }
      }`,
      variableValues: {
        cfg: { potential: 'double_well', steps: 40, dt: 0.01, particles: 2000, seed: 3 }
      },
      contextValue: ctx
    });
    expect(sdeResult.errors).toBeUndefined();
    const sdeId = (sdeResult.data as any).diffusionRunSDE.id;

    const fpResult = await graphql({
      schema,
      source: `mutation Run($cfg: FPConfig!) {
        diffusionRunFP(cfg: $cfg) { id mode status }
      }`,
      variableValues: {
        cfg: { potential: 'double_well', steps: 20, dt: 0.01, grid: [32, 32], boundary: 'neumann', seed: 3 }
      },
      contextValue: ctx
    });
    expect(fpResult.errors).toBeUndefined();
    const fpId = (fpResult.data as any).diffusionRunFP.id;

    const compareResult = await graphql({
      schema,
      source: `mutation Compare($sde: ID!, $fp: ID!) {
        diffusionCompare(sdeJob: $sde, fpJob: $fp) { status metrics }
      }`,
      variableValues: { sde: sdeId, fp: fpId },
      contextValue: ctx
    });
    expect(compareResult.errors).toBeUndefined();
    const metrics = (compareResult.data as any).diffusionCompare.metrics;
    expect(metrics.kl.length).toBeGreaterThan(0);
  });
});
