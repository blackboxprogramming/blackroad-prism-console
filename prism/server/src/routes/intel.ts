import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { computeDiffIntel } from '../analysis/diffIntel';
import { PrismDiff } from '../types';

const DiffReq = z.object({
  projectId: z.string(),
  diffs: z.array(z.object({ path: z.string(), patch: z.string() }))
});

export default async function intelRoutes(app: FastifyInstance) {
  app.post('/intel/diff', async (req, reply) => {
    const body = DiffReq.parse(req.body);
    const intel = await computeDiffIntel(body.diffs as PrismDiff[], process.cwd());
    reply.send({ intel });
  });
}
