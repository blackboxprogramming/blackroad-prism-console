import { GraphQLScalarType, Kind } from 'graphql';
import { runPdeJob } from './pde.js';
import { runMdpJob } from './mdp.js';
import { runRollout } from './rollout.js';
import { assertCanView } from '../auth/rbac.js';
import type { GatewayContext, HjbJobStore } from './types.js';

export function createResolvers(store: HjbJobStore) {
  const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return value;
    },
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.STRING:
          try {
            return JSON.parse(ast.value);
          } catch (error) {
            throw new Error(`Invalid JSON literal: ${(error as Error).message}`);
          }
        case Kind.INT:
        case Kind.FLOAT:
        case Kind.BOOLEAN:
          return (ast as any).value;
        case Kind.OBJECT:
        case Kind.LIST:
          return null;
        default:
          return null;
      }
    }
  });

  return {
    JSON: JSONScalar,
    hjbSolvePDE: ({ config }: { config: unknown }, context: GatewayContext) => runPdeJob(store, config, context),
    hjbSolveMDP: ({ config }: { config: unknown }, context: GatewayContext) => runMdpJob(store, config, context),
    hjbRollout: (
      { jobId, start, steps, dt }: { jobId: string; start: number[]; steps?: number; dt?: number },
      context: GatewayContext
    ) => runRollout(store, jobId, start, steps ?? 600, dt ?? 0.05, context),
    hjbJob: ({ id }: { id: string }, context: GatewayContext) => {
      assertCanView(context);
      return store.get(id) ?? null;
    },
    hjbEvents: ({ jobId }: { jobId?: string }, context: GatewayContext) => {
      assertCanView(context);
      if (jobId) {
        return store.get(jobId) ?? null;
      }
      return null;
    }
  };
}
