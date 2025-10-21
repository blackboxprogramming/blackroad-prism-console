import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

app.removeContentTypeParser('application/json');
app.removeContentTypeParser('text/plain');

app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const normalized = typeof body === 'string' ? body : body?.toString('utf-8') || '';
    const buffer = Buffer.from(normalized, 'utf-8');
    (req as any).rawBody = buffer;
    if (!normalized) return done(null, {});
    const json = JSON.parse(normalized);
    done(null, json);
  } catch (err) {
    done(err as Error, undefined);
  }
});

app.addContentTypeParser('*', { parseAs: 'buffer' }, (req, body, done) => {
  (req as any).rawBody = body;
  done(null, body);
});

const jsonParser = app.getDefaultJsonParser('ignore', 'ignore');
app.addContentTypeParser(/^application\/json(;.*)?$/, { parseAs: 'buffer' }, (req, body, done) => {
  (req as any).rawBody = body;
  const text = Buffer.isBuffer(body) ? body.toString() : body;
  jsonParser(req, text, done);
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
await app.register(import('./routes/webhooks_github.js'), { prefix: '/' });
await app.register(import('./routes/v1/echo.js'), { prefix: '/v1' });
await app.register(import('./routes/v1/sources.js'), { prefix: '/v1' });
await app.register(import('./routes/v1/metrics_github.js'), { prefix: '/v1' });
await app.register(import('./routes/v1/linear.js'), { prefix: '/v1' });
await app.register(import('./routes/webhooks_stripe.js'), { prefix: '/' });

const port = Number(process.env.PORT || 3001);
app.listen({ port, host: '0.0.0.0' }).catch((e) => {
  app.log.error(e); process.exit(1);
});
