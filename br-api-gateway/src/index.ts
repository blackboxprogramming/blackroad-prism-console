import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { context, trace } from '@opentelemetry/api';

import { sdk } from '../otel.js';

await sdk.start();

const [{ default: Fastify }, { default: swagger }, { default: swaggerUI }] = await Promise.all([
  import('fastify'),
  import('@fastify/swagger'),
  import('@fastify/swagger-ui')
]);

type SpanContextAccessor = () => { traceId: string; spanId: string } | undefined;

const getActiveSpanContext: SpanContextAccessor = () => {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();

  if (!spanContext || !spanContext.traceId || !spanContext.spanId) {
    return undefined;
  }

  return { traceId: spanContext.traceId, spanId: spanContext.spanId };
};

const globalWithSpan = globalThis as typeof globalThis & { _otlpSpanContext?: SpanContextAccessor };

globalWithSpan._otlpSpanContext = getActiveSpanContext;

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
    mixin() {
      const spanContext = getActiveSpanContext();
      return spanContext ? { trace_id: spanContext.traceId, span_id: spanContext.spanId } : {};
    }
  }
});

app.addHook('onRequest', (req, _res, done) => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = randomUUID();
  }
  done();
});

await app.register(swagger, {
  openapi: {
    info: { title: 'BlackRoad API', version: '0.1.0' },
    servers: [{ url: 'https://api.blackroad.io' }]
  }
});
await app.register(swaggerUI, { routePrefix: '/docs' });

app.get('/health', async () => ({ ok: true, service: 'br-api-gateway', ts: Date.now() }));

// routes
await app.register(import('./routes/health.js'), { prefix: '/' });
await app.register(import('./routes/v1/echo.js'), { prefix: '/v1' });

const port = Number(process.env.PORT || 3001);
app.listen({ port, host: '0.0.0.0' }).catch((e) => {
  app.log.error(e); process.exit(1);
});

let isShuttingDown = false;

const shutdown = async (instance: FastifyInstance) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    await sdk.shutdown();
  } catch (error) {
    instance.log.error({ err: error }, 'failed to shutdown OpenTelemetry sdk');
  }
};

process.once('SIGTERM', async () => {
  await app.close();
  await shutdown(app);
  process.exit(0);
});

process.once('SIGINT', async () => {
  await app.close();
  await shutdown(app);
  process.exit(0);
});

app.addHook('onClose', async () => {
  await shutdown(app);
});
