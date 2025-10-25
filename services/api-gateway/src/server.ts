import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import authPlugin from './plugins/auth.js';
import observabilityPlugin from './plugins/observability.js';
import dashboardRoute from './routes/dashboard.js';
import healthRoute from './routes/health.js';

export function buildServer() {
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty'
      }
    }
  });

  fastify.register(cors, { origin: true });
  fastify.register(sensible);
  fastify.register(swagger, {
    openapi: {
      info: {
        title: 'BlackRoad API Gateway',
        version: '0.1.0'
      }
    }
  });

  fastify.register(observabilityPlugin);
  fastify.register(authPlugin);
  fastify.register(healthRoute);
  fastify.register(dashboardRoute, { prefix: '/api' });

  return fastify;
}
