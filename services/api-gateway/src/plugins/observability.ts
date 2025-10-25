import fp from 'fastify-plugin';
import type { FastifyPluginCallback } from 'fastify';

const observabilityPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('onRequest', async (request) => {
    request.log.info({ path: request.url, requestId: request.id }, 'incoming request');
  });

  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info({ statusCode: reply.statusCode, requestId: request.id }, 'completed request');
  });

  done();
};

export default fp(observabilityPlugin);
