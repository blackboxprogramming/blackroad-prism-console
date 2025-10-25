import type { FastifyPluginCallback } from 'fastify';
import { env } from '../config/env.js';
import { z } from 'zod';
import { request as undiciRequest } from 'undici';

const metricSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.string(),
  caption: z.string(),
  icon: z.string(),
  status: z.enum(['healthy', 'warning', 'critical'])
});

const shortcutSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  url: z.string().url()
});

const dashboardSchema = z.object({
  summary: z.string(),
  metrics: z.array(metricSchema),
  shortcuts: z.array(shortcutSchema)
});

type DashboardPayload = z.infer<typeof dashboardSchema>;

const dashboardRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/mobile/dashboard', async (request, reply) => {
    try {
      const upstream = await undiciRequest(env.BLACKROAD_API_URL, {
        headers: {
          authorization: request.headers.authorization ?? ''
        }
      });

      if (upstream.statusCode !== 200) {
        request.log.warn({ status: upstream.statusCode }, 'upstream error');
        return reply.code(502).send({ message: 'Upstream failure' });
      }

      const payload = (await upstream.body.json()) as unknown;
      const parsed = dashboardSchema.parse(payload);
      return parsed satisfies DashboardPayload;
    } catch (error) {
      request.log.error({ error }, 'dashboard fetch failed');
      return reply.code(500).send({ message: 'Failed to proxy dashboard' });
    }
  });

  done();
};

export default dashboardRoute;
