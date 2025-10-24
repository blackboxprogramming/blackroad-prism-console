import { GraphQLResolveInfo } from 'graphql';
import { assertRole } from '../auth/oidc';
import { Environment, Service } from '../domain';
import { GatewayContext } from '../store';

interface ServiceArgs {
  id: string;
}

export const serviceResolvers = {
  Query: {
    service(_parent: unknown, args: ServiceArgs, context: GatewayContext, _info: GraphQLResolveInfo): Service | null {
      assertRole(context.principal, 'viewer');
      return context.store.getService(args.id) ?? null;
    }
  },
  Service: {
    environments(parent: Service, _args: unknown, context: GatewayContext): Environment[] {
      return parent.environments
        .map((ref) => context.store.getEnvironment(ref.id) ?? { ...ref })
        .filter((env): env is Environment => Boolean(env));
    }
  }
};
