import { GraphQLSchema } from './graphql';
import { InprocEventBus, MeshMetrics, EventEnvelope } from './mesh';
import { CorrelationEngine } from './correlations';
import { GatewayResolvers, EventFilter, ResolverContext } from './resolvers/events';
import { streamToSse } from './http/sse';
import { GatewayTelemetry } from './otel';

export interface PublishOptions {
  recordMetrics?: boolean;
}

export class ObservabilityGateway {
  private readonly telemetry: GatewayTelemetry;

  constructor(
    private readonly bus: InprocEventBus,
    private readonly correlations: CorrelationEngine,
    private readonly metrics: MeshMetrics = new MeshMetrics(),
  ) {
    this.telemetry = new GatewayTelemetry(this.metrics);
  }

  publish(event: EventEnvelope, options: PublishOptions = {}): void {
    this.bus.publish(event);
    if (options.recordMetrics !== false) {
      this.telemetry.recordIngest(event);
    }
    this.correlations.ingest(event);
  }

  getSchema(): GraphQLSchema {
    return new GatewayResolvers(this.bus, this.correlations).getSchema();
  }

  createResolvers(): GatewayResolvers {
    return new GatewayResolvers(this.bus, this.correlations);
  }

  async stream(filter: EventFilter | undefined, context: ResolverContext, response: Parameters<typeof streamToSse>[1]) {
    const resolvers = this.createResolvers();
    const iterator = resolvers.subscribeEvents(filter, context);
    await streamToSse(iterator, response);
  }
}

export function createGateway(): ObservabilityGateway {
  const bus = new InprocEventBus();
  const correlations = new CorrelationEngine();
  return new ObservabilityGateway(bus, correlations);
}

export * from './chat/store';
export * from './chat/slackBridge';
export * from './auth/rbac';
export * from './http/sse';
export * from './resolvers/chat';
