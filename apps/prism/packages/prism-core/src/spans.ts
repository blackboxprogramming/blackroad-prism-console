import {PrismSpan} from './types';

export interface SpanTrackerOptions {
  clock?: () => Date;
  idFactory?: () => string;
}

export interface StartSpanOptions {
  name: string;
  parentSpanId?: string;
  attrs?: Record<string, any>;
  links?: string[];
  startTs?: string;
}

export interface EndSpanOptions {
  endTs?: string;
  status?: PrismSpan['status'];
  attrs?: Record<string, any>;
}

export interface SpanTracker {
  start(options: StartSpanOptions): PrismSpan;
  end(spanId: string, options?: EndSpanOptions): PrismSpan | undefined;
  get(spanId: string): PrismSpan | undefined;
  list(): PrismSpan[];
  clear(): void;
}

const DEFAULT_STATUS: PrismSpan['status'] = 'ok';

function toIso(value: string | undefined, clock: () => Date) {
  return value ?? clock().toISOString();
}

const defaultId = () => {
  const cryptoApi = (globalThis as any).crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export function createSpanTracker(options: SpanTrackerOptions = {}): SpanTracker {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? defaultId;
  const spans = new Map<string, PrismSpan>();
  const clone = (span: PrismSpan | undefined): PrismSpan | undefined => {
    if (!span) return undefined;
    return {
      ...span,
      attrs: span.attrs ? {...span.attrs} : undefined,
      links: span.links ? [...span.links] : undefined,
    };
  };

  return {
    start({name, parentSpanId, attrs, links, startTs}) {
      const spanId = idFactory();
      const span: PrismSpan = {
        spanId,
        parentSpanId,
        name,
        startTs: toIso(startTs, clock),
        status: DEFAULT_STATUS,
        attrs: attrs ? {...attrs} : undefined,
        links: links ? [...links] : undefined,
      };
      spans.set(spanId, span);
      return clone(spans.get(spanId))!;
    },
    end(spanId, options) {
      const span = spans.get(spanId);
      if (!span) {
        return undefined;
      }
      if (options?.endTs) {
        span.endTs = options.endTs;
      } else {
        span.endTs = toIso(undefined, clock);
      }
      if (options?.status) {
        span.status = options.status;
      }
      if (options?.attrs) {
        span.attrs = {...(span.attrs ?? {}), ...options.attrs};
      }
      return clone(spans.get(spanId));
    },
    get(spanId) {
      return clone(spans.get(spanId));
    },
    list() {
      return Array.from(spans.values()).map((span) => clone(span)!);
    },
    clear() {
      spans.clear();
    },
  };
}
