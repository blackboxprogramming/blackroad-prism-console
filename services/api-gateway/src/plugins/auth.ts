import fp from 'fastify-plugin';
import type { FastifyPluginCallback } from 'fastify';
import { env } from '../config/env.js';
import { request as undiciRequest } from 'undici';

const authPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request, reply) => {
    if (request.routeOptions.url === '/health') {
      return;
    }

    const header = request.headers.authorization;
    if (!header) {
      reply.code(401).send({ message: 'Missing Authorization header' });
      return reply;
    }

    const token = header.replace('Bearer ', '');
    const verification = await requestAuth(token);
    if (!verification.valid) {
      reply.code(401).send({ message: 'Invalid token' });
      return reply;
    }

    request.user = verification.user;
  });

  done();
};

async function requestAuth(token: string): Promise<{ valid: boolean; user?: { id: string } }> {
  try {
    const { statusCode, body } = await undiciRequest(`${env.AUTH_SERVICE_URL}/tokens/verify`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.SERVICE_TOKEN}`
      },
      body: JSON.stringify({ token })
    });

    if (statusCode !== 200) {
      return { valid: false };
    }

    const payload = (await body.json()) as { valid: boolean; user?: { id: string } };
    return payload;
  } catch (error) {
    return { valid: false };
  }
}

export default fp(authPlugin);

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string } | null;
  }
}
