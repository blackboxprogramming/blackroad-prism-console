import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listIntelligenceEvents } from '../db/sqlite';
import { register as registerStream } from '../bus/intelligence';

export default async function intelligenceRoutes(fastify: FastifyInstance) {
  fastify.get('/intelligence/events', async (req, reply) => {
    const query = z.object({ limit: z.coerce.number().default(200) }).parse(req.query);
    const events = listIntelligenceEvents(query.limit);
    reply.send(events);
  });

  fastify.get('/intelligence/events/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    reply.raw.write('\n');
    registerStream(reply);
  });
}
