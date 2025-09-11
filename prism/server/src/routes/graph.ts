import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { graphStore } from '../graph/ingest';

export default async function graphRoutes(app: FastifyInstance) {
  app.get('/graph', async (req, reply) => {
    const projectId = (req.query as any).projectId || 'default';
    reply.send(graphStore.getGraph(projectId));
  });
  app.post('/graph/rebuild', async (req, reply) => {
    const body = z.object({ projectId: z.string() }).parse(req.body);
    graphStore.rebuild(body.projectId);
    reply.send({ ok: true });
  });
  app.post('/graph/event', async (req, reply) => {
    const body = z.object({ projectId: z.string(), event: z.any() }).parse(req.body);
    graphStore.ingest(body.projectId, body.event);
    reply.send({ ok: true });
  });
}
