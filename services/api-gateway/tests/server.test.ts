import { describe, expect, it, beforeEach, afterAll, vi } from 'vitest';
import { setGlobalDispatcher, MockAgent, getGlobalDispatcher } from 'undici';

process.env.PORT = process.env.PORT ?? '8080';
process.env.AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://auth.local';
process.env.BLACKROAD_API_URL = process.env.BLACKROAD_API_URL ?? 'http://localhost:5052/api/mobile/dashboard';
process.env.SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? 'service-token';

vi.mock('../src/plugins/auth.js', () => ({
  default: (fastify: any, _opts: any, done: any) => {
    fastify.addHook('preHandler', async (request: any, reply: any) => {
      if (request.routeOptions.url === '/health') {
        return;
      }
      if (request.headers.authorization === 'Bearer allowed') {
        request.user = { id: 'tester' };
        return;
      }
      reply.code(401).send({ message: 'Invalid token' });
      return reply;
    });
    done();
  }
}));

const originalDispatcher = getGlobalDispatcher();
const mockAgent = new MockAgent();
mockAgent.disableNetConnect();

const { env } = await import('../src/config/env.js');
const { buildServer } = await import('../src/server.js');

const upstreamPool = mockAgent.get(new URL(env.BLACKROAD_API_URL).origin);
upstreamPool
  .intercept({ path: new URL(env.BLACKROAD_API_URL).pathname, method: 'GET' })
  .reply(200, { summary: 'ok', metrics: [], shortcuts: [] });

beforeEach(() => {
  setGlobalDispatcher(mockAgent);
});

afterAll(() => {
  setGlobalDispatcher(originalDispatcher);
});

describe('API Gateway', () => {
  it('serves health endpoint without auth', async () => {
    const server = buildServer();
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
  });

  it('rejects unauthenticated dashboard requests', async () => {
    const server = buildServer();
    const response = await server.inject({ method: 'GET', url: '/api/mobile/dashboard' });
    expect(response.statusCode).toBe(401);
  });

  it('proxies dashboard when auth succeeds', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/mobile/dashboard',
      headers: { authorization: 'Bearer allowed' }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('summary', 'ok');
  });
});
