import { FastifyInstance } from 'fastify';
import { checkCapability } from '../policy';
import { recordWorkflowEvent } from '../observability';

export default async function runRoutes(app: FastifyInstance) {
  app.post('/run', async (req, reply) => {
    const decision = checkCapability('exec');
    recordWorkflowEvent(`run.decision.${decision}`);
    req.log.info({ decision }, 'run capability decision');
    if (decision === 'forbid') {
      recordWorkflowEvent('run.forbidden');
      reply.code(403).send({ capability: 'exec', mode: 'forbid', message: 'exec forbidden in this mode' });
      return;
    }
    if (decision === 'review') {
      recordWorkflowEvent('run.pending_review');
      reply.send({ status: 'pending' });
      return;
    }
    recordWorkflowEvent('run.started');
    req.log.info('run accepted for execution');
    reply.send({ status: 'started' });
  });
}
