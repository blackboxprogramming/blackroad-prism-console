import { createRequire } from 'node:module';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { loadRoutes } from './config/routes.js';
import validationPlugin from './plugins/validation.js';
import correlationPlugin from './plugins/correlation.js';
import loggingPlugin from './plugins/logging.js';
import metricsPlugin from './plugins/metrics.js';
import tracingPlugin from './plugins/tracing.js';
import securityPlugin from './plugins/security.js';
import authPlugin from './plugins/auth.js';
import proxyPlugin from './plugins/proxy.js';
import metaRoutes from './routes/meta.js';
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import automationRoutes from './routes/automation.js';
import consoleRoutes from './routes/console.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const GENERIC_PREFIXES = new Set(['/automation', '/console', '/search']);

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.GATEWAY_LOG_LEVEL,
      transport: env.isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard'
            }
          }
        : undefined
    },
    trustProxy: true,
    bodyLimit: 1_048_576,
    disableRequestLogging: true
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(validationPlugin);
  await fastify.register(correlationPlugin);
  await fastify.register(loggingPlugin);
  await fastify.register(metricsPlugin);
  await fastify.register(tracingPlugin);
  await fastify.register(securityPlugin);
  await fastify.register(authPlugin);
  await fastify.register(proxyPlugin);

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'BlackRoad API Gateway',
        version: pkg.version,
        description: 'Secure entry point for BlackRoad services'
      }
    },
    transform: jsonSchemaTransform
  });

  if (env.isDev) {
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list'
      }
    });
  }

  await fastify.register(metaRoutes);
  await fastify.register(authRoutes);
  await fastify.register(searchRoutes);
  await fastify.register(automationRoutes);
  await fastify.register(consoleRoutes);

  const routes = await loadRoutes();

  for (const route of routes) {
    const baseUrl = (process.env[route.target] ?? (env as Record<string, unknown>)[route.target]) as string | undefined;
    if (!baseUrl) {
      fastify.log.warn({ route }, 'Skipping route registration because backend URL missing');
      continue;
    }
    fastify.proxy.registerBackend(route.target, baseUrl);

    if (GENERIC_PREFIXES.has(route.prefix)) {
      continue;
    }

    const handler = fastify.proxy.handler(route.target, { stripPrefix: route.prefix });

    fastify.register(
      (instance, _opts, done) => {
        if (route.auth === 'required') {
          instance.addHook('preHandler', async (request, reply) => {
            await fastify.auth.required(request, reply);
          });
        } else {
          instance.addHook('preHandler', async (request, reply) => {
            await fastify.auth.optional(request, reply);
          });
        }

        instance.all('/*', async (request, reply) => {
          await handler(request, reply);
        });
        done();
      },
      { prefix: route.prefix }
    );
  }

  return fastify;
}
