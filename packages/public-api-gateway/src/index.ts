import express, { Application } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import deployRoutes from './http/routes/deploys.js';
import captionsRoutes from './http/routes/captions.js';
import simulationsRoutes from './http/routes/simulations.js';
import webhookRoutes from './http/routes/webhooks.js';
import { oauthMiddleware, serviceTokenMiddleware, signatureMiddleware } from './http/middleware/auth.js';
import { rateLimitMiddleware } from './http/middleware/ratelimit.js';
import { idempotencyMiddleware } from './http/middleware/idempotency.js';

export interface PublicGatewayOptions {
  logger?: pino.Logger;
}

export function createGateway(options: PublicGatewayOptions = {}): Application {
  const logger = options.logger ?? pino({ name: 'public-api-gateway' });
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));
  app.use(signatureMiddleware());
  app.use(oauthMiddleware());
  app.use(serviceTokenMiddleware());
  app.use(rateLimitMiddleware());
  app.use(idempotencyMiddleware());

  app.use('/v1/deploys', deployRoutes);
  app.use('/v1/captions', captionsRoutes);
  app.use('/v1/simulations', simulationsRoutes);
  app.use('/v1/webhooks', webhookRoutes);

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

export default createGateway;
