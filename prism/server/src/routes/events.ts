import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { insertEvent, listEvents } from '../db/sqlite';
import { broadcast, register } from '../bus/sse';
import { PrismEvent } from '@prism/core';

const eventSchema: z.ZodType<PrismEvent> = z.object({
  id: z.string(),
  ts: z.string(),
  actor: z.union([z.literal('user'), z.literal('lucidia'), z.string().regex(/^agent:.+/)]),
  kind: z.enum(['prompt','plan','file.write','file.diff','run.start','run.end','test.start','test.end','deploy.start','deploy.end','net.req','net.res','graph.update','error','warn']),
  projectId: z.string(),
  sessionId: z.string(),
  facet: z.enum(['time','space','intent']),
  summary: z.string(),
  ctx: z.record(z.any()).optional()
});

export default async function eventsRoutes(fastify: FastifyInstance) {
  fastify.post('/events', async (req, reply) => {
    const body = eventSchema.parse(req.body);
    insertEvent(body);
    broadcast(body);
    reply.send({ ok: true });
  });

  fastify.get('/events', async (req, reply) => {
    const query = z.object({ projectId: z.string(), limit: z.coerce.number().default(100) }).parse(req.query);
    const rows = listEvents(query.projectId, query.limit);
    reply.send(rows);
  });

  fastify.get('/events/stream', async (req, reply) => {
    z.object({ projectId: z.string(), sessionId: z.string() }).parse(req.query);
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    reply.raw.write('\n');
    register(reply);
  });
}
