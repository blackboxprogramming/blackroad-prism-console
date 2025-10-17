import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
  register as defaultRegistry,
} from 'prom-client';

const registry: Registry = defaultRegistry;

const httpRequestsTotal = new Counter({
  name: 'prism_http_requests_total',
  help: 'HTTP requests processed by the Prism server',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

const httpRequestDurationSeconds = new Histogram({
  name: 'prism_http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

const httpRequestsInFlight = new Gauge({
  name: 'prism_http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [registry],
});

const capabilityDecisions = new Counter({
  name: 'prism_capability_decisions_total',
  help: 'Count of capability gate decisions',
  labelNames: ['capability', 'decision', 'mode'],
  registers: [registry],
});

const workflowEvents = new Counter({
  name: 'prism_workflow_events_total',
  help: 'High-level workflow events emitted by the Prism server',
  labelNames: ['event'],
  registers: [registry],
});

const durationSymbol = Symbol('durationTimer');
const labelSymbol = Symbol('metricLabels');
const inflightSymbol = Symbol('inflight');
const completedSymbol = Symbol('metricsCompleted');

function routeLabel(req: FastifyRequest): string {
  return req.routerPath ?? req.url ?? 'unknown';
}

export async function observabilityPlugin(app: FastifyInstance) {
  collectDefaultMetrics({ register: registry });

  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });

  app.addHook('onRequest', async (req, _reply) => {
    httpRequestsInFlight.inc();
    (req as any)[inflightSymbol] = true;
    const route = routeLabel(req);
    const labels = { method: req.method, route };
    (req as any)[labelSymbol] = labels;
    (req as any)[durationSymbol] = httpRequestDurationSeconds.startTimer(labels);
  });

  app.addHook('onResponse', async (req, reply) => {
    if ((req as any)[inflightSymbol]) {
      httpRequestsInFlight.dec();
      (req as any)[inflightSymbol] = false;
    }
    if ((req as any)[completedSymbol]) {
      return;
    }
    const status = reply.statusCode.toString();
    const labels = { ...((req as any)[labelSymbol] ?? { method: req.method, route: routeLabel(req) }), status };
    httpRequestsTotal.inc(labels);
    const timer = (req as any)[durationSymbol] as ReturnType<typeof httpRequestDurationSeconds.startTimer> | undefined;
    if (typeof timer === 'function') {
      timer({ status });
    }
    (req as any)[completedSymbol] = true;
  });

  app.addHook('onError', async (req, reply, error) => {
    if ((req as any)[inflightSymbol]) {
      httpRequestsInFlight.dec();
      (req as any)[inflightSymbol] = false;
    }
    (req as any)[completedSymbol] = true;
    const status = reply.statusCode ? reply.statusCode.toString() : 'error';
    const labels = { method: req.method, route: routeLabel(req), status };
    httpRequestsTotal.inc(labels);
    app.log.error({ err: error, ...labels }, 'request failed');
    const timer = (req as any)[durationSymbol] as ReturnType<typeof httpRequestDurationSeconds.startTimer> | undefined;
    if (typeof timer === 'function') {
      timer({ status });
    }
  });
}

export function recordCapabilityDecision(capability: string, decision: string, mode: string) {
  capabilityDecisions.inc({ capability, decision, mode });
}

export function recordWorkflowEvent(event: string) {
  workflowEvents.inc({ event });
}
