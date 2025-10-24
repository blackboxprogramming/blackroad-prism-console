import type { GatewayContext } from '../resolvers/types.js';

export function assertCanMutate(context: GatewayContext) {
  if (context.role === 'viewer') {
    throw new Error('viewer role cannot mutate control lab state');
  }
}

export function assertCanView(context: GatewayContext) {
  if (!context.role) {
    throw new Error('missing role in context');
  }
}
