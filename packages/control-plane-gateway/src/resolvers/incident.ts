import { assertRole } from '../auth/oidc';
import { createIncidentAdapter } from '../adapters';
import { Incident } from '../domain';
import { GatewayContext } from '../store';

interface IncidentArgs {
  serviceId: string;
  limit?: number;
}

export const incidentResolvers = {
  Query: {
    async incidents(_parent: unknown, args: IncidentArgs, context: GatewayContext): Promise<Incident[]> {
      assertRole(context.principal, 'operator');
      const adapter = createIncidentAdapter(context.store);
      return adapter.recent({ serviceId: args.serviceId, limit: args.limit });
    }
  }
};
