import { captionTypeDefs } from './schema';
import { CaptionResolver } from './resolvers/caption';
import { CaptionJobQueue } from './jobs/queue';

export interface CaptionGatewayContext {
  queue: CaptionJobQueue;
  resolvers: CaptionResolver;
  typeDefs: string;
}

export function createCaptionGateway(): CaptionGatewayContext {
  const queue = new CaptionJobQueue();
  const resolvers = new CaptionResolver(queue);
  return {
    queue,
    resolvers,
    typeDefs: captionTypeDefs
  };
}

export * from './types';
export * from './jobs/queue';
export * from './jobs/worker';
export * from './auth/rbac';
export * from './otel';
export * from './resolvers/caption';
export * from './schema';
