import { ExecutionResult } from '../graphql';
import { InprocEventBus, EventEnvelope } from '../mesh';
import { CorrelationEngine, CorrelatedTimeline, CorrelationKeyType } from '../correlations';
import { authorize, Operation } from '../auth/rbac';
import { buildGatewaySchema } from '../schema';

export interface EventFilter {
  source?: string[];
  service?: string[];
  kind?: string[];
  releaseId?: string;
  assetId?: string;
  simId?: string;
  traceId?: string;
  since?: string;
  until?: string;
  severity?: string[];
}

export interface ResolverContext {
  role: 'viewer' | 'operator' | 'admin';
  scopes?: string[];
}

function passesFilter(event: EventEnvelope, filter?: EventFilter): boolean {
  if (!filter) return true;
  if (filter.source && !filter.source.includes(event.source)) return false;
  if (filter.service && !filter.service.includes(event.service)) return false;
  if (filter.kind && !filter.kind.includes(event.kind)) return false;
  if (filter.releaseId && filter.releaseId !== event.releaseId) return false;
  if (filter.assetId && filter.assetId !== event.assetId) return false;
  if (filter.simId && filter.simId !== event.simId) return false;
  if (filter.traceId && filter.traceId !== event.traceId) return false;
  if (filter.severity && event.severity && !filter.severity.includes(event.severity)) return false;
  if (filter.since && new Date(event.ts) < new Date(filter.since)) return false;
  if (filter.until && new Date(event.ts) > new Date(filter.until)) return false;
  return true;
}

export class GatewayResolvers {
  private readonly schema = buildGatewaySchema();

  constructor(private readonly bus: InprocEventBus, private readonly correlations: CorrelationEngine) {}

  correlate(args: { key: string; keyType: CorrelationKeyType }, context: ResolverContext): CorrelatedTimeline {
    this.ensureAuthorized(context, 'correlate:read');
    return this.correlations.correlate(args.key, args.keyType);
  }

  subscribeEvents(filter: EventFilter | undefined, context: ResolverContext): AsyncIterableIterator<ExecutionResult> {
    this.ensureAuthorized(context, 'events:read');
    const bus = this.bus;

    const generator = (async function* generate(): AsyncGenerator<ExecutionResult> {
      const queue: EventEnvelope[] = [];
      const unsubscribe = bus.subscribe((event: EventEnvelope) => {
        if (passesFilter(event, filter)) {
          queue.push(event);
        }
      });

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (queue.length === 0) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            continue;
          }
          const next = queue.shift();
          if (!next) {
            continue;
          }
          yield { data: { events: next } } as ExecutionResult;
        }
      } finally {
        unsubscribe();
      }
    })();

    return generator as AsyncIterableIterator<ExecutionResult>;
  }

  getSchema() {
    return this.schema;
  }

  private ensureAuthorized(context: ResolverContext, operation: Operation): void {
    if (!authorize({ role: context.role, scopes: context.scopes ?? [] }, operation)) {
      throw new Error('forbidden');
    }
  }
}

