import type { FastifyPluginCallback } from 'fastify';

const healthRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  done();
};

export default healthRoute;
