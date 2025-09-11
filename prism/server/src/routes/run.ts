import { FastifyInstance } from 'fastify';
import { checkCapability } from '../policy';

export default async function runRoutes(app: FastifyInstance) {
  app.post('/run', async (_req, reply) => {
    const decision = checkCapability('exec');
    if (decision === 'forbid') {
      reply.code(403).send({ capability: 'exec', mode: 'forbid', message: 'exec forbidden in this mode' });
      return;
    }
    if (decision === 'review') {
      reply.send({ status: 'pending' });
      return;
    }
    reply.send({ status: 'started' });
  });
}
