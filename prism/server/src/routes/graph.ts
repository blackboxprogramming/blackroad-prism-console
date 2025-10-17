import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { graphStore } from '../graph/ingest';
import { ServerResponse } from 'http';
import { recordWorkflowEvent } from '../observability';

export default async function graphRoutes(app: FastifyInstance) {
  app.get('/graph', async (req, reply) => {
    const projectId = (req.query as any).projectId || 'default';
    recordWorkflowEvent('graph.fetch');
    req.log.info({ projectId }, 'graph fetch');
    reply.send(graphStore.getGraph(projectId));
  });
  app.post('/graph/rebuild', async (req, reply) => {
    const body = z.object({ projectId: z.string() }).parse(req.body);
    recordWorkflowEvent('graph.rebuild');
    req.log.warn({ projectId: body.projectId }, 'graph rebuild triggered');
    graphStore.rebuild(body.projectId);
    reply.send({ ok: true });
  });
  app.post('/graph/event', async (req, reply) => {
    const body = z.object({ projectId: z.string(), event: z.any() }).parse(req.body);
    recordWorkflowEvent('graph.event_ingest');
    graphStore.ingest(body.projectId, body.event);
    reply.send({ ok: true });
  });
  app.get('/graph/stream', async (req, reply) => {
    const projectId = (req.query as any).projectId || 'default';
    recordWorkflowEvent('graph.stream_opened');
    const res = reply.raw as ServerResponse;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const send = (pid: string, node: any) => {
      if (pid !== projectId) return;
      res.write(`data: ${JSON.stringify({ type: 'node', op: 'upsert', data: node })}\n\n`);
    };
    graphStore.on('node', send);
    req.raw.on('close', () => {
      graphStore.off('node', send);
      recordWorkflowEvent('graph.stream_closed');
    });
  });
}
