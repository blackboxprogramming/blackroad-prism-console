import { FastifyInstance } from 'fastify';
import { checkCapability } from '../policy';

export default async function diffRoutes(app: FastifyInstance) {
  app.post('/diffs/apply', async (_req, reply) => {
    const decision = checkCapability('write');
    if (decision === 'forbid') {
      reply.code(403).send({ capability: 'write', mode: 'forbid', message: 'write forbidden in this mode' });
      return;
    }
    if (decision === 'review') {
      reply.send({ status: 'pending' });
      return;
    }
    reply.send({ status: 'applied' });
  });
}
