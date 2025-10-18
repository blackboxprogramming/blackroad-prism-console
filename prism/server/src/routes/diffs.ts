import { FastifyInstance } from 'fastify';
import { checkCapability } from '../policy';
import { recordWorkflowEvent } from '../observability';

export default async function diffRoutes(app: FastifyInstance) {
  app.post('/diffs/apply', async (req, reply) => {
    const decision = checkCapability('write');
    recordWorkflowEvent(`diffs.decision.${decision}`);
    req.log.info({ decision }, 'diff apply capability decision');
    if (decision === 'forbid') {
      recordWorkflowEvent('diffs.forbidden');
      reply.code(403).send({ capability: 'write', mode: 'forbid', message: 'write forbidden in this mode' });
      return;
    }
    if (decision === 'review') {
      recordWorkflowEvent('diffs.pending_review');
      reply.send({ status: 'pending' });
      return;
    }
    recordWorkflowEvent('diffs.applied');
    reply.send({ status: 'applied' });
  });
}
