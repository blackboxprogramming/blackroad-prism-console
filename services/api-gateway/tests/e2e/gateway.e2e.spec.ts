import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MockAgent, setGlobalDispatcher } from 'undici';
import type { FastifyInstance } from 'fastify';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('gateway e2e', () => {
  let mockAgent: MockAgent;
  let app: FastifyInstance;

  beforeAll(async () => {
    vi.resetModules();
    process.env.GATEWAY_PORT = '0';
    process.env.GATEWAY_ENV = 'test';
    process.env.GATEWAY_LOG_LEVEL = 'silent';
    process.env.GATEWAY_RATE_LIMIT_RPM = '5';
    process.env.METRICS_ENABLED = 'true';
    process.env.AUTH_BASE_URL = 'http://auth.test';
    process.env.ROADGLITCH_BASE_URL = 'http://roadglitch.test';
    process.env.CONSOLE_BASE_URL = 'http://console.test';
    process.env.SEARCH_BASE_URL = 'http://search.test';

    mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    setGlobalDispatcher(mockAgent);

    const authMock = mockAgent.get('http://auth.test');
    authMock
      .intercept({ path: '/tokens/verify', method: 'POST' })
      .reply(200, { sub: 'user-abc', scope: 'automation:run' })
      .times(1);

    const roadglitch = mockAgent.get('http://roadglitch.test');
    roadglitch
      .intercept({ path: '/runs', method: 'POST' })
      .reply(200, { id: 'run-1' })
      .times(1);

    const consoleApi = mockAgent.get('http://console.test');
    consoleApi
      .intercept({ path: '/mobile/dashboard', method: 'GET' })
      .reply(200, {
        summary: { incidents: 1, automationSuccessRate: 0.9, activeAlerts: 0 },
        widgets: []
      })
      .times(1);

    const searchApi = mockAgent.get('http://search.test');
    searchApi
      .intercept({ path: '/search?q=lucidia', method: 'GET' })
      .reply(200, { results: [], nextCursor: null })
      .times(1);

    const { buildServer } = await import('../../src/app.js');
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    mockAgent.assertNoPendingInterceptors();
    await mockAgent.close();
  });

  it('reports health status with backends', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.status).toBe('ok');
    expect(Array.isArray(payload.backends)).toBe(true);
  });

  it('enforces auth on automation routes', async () => {
    const unauthorized = await app.inject({ method: 'POST', url: '/automation/runs' });
    expect(unauthorized.statusCode).toBe(401);

    const authorized = await app.inject({
      method: 'POST',
      url: '/automation/runs',
      headers: { Authorization: 'Bearer valid-token' },
      payload: { job: 'deploy' }
    });
    expect(authorized.statusCode).toBe(200);
    expect(authorized.json().id).toBe('run-1');
  });

  it('validates console responses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/console/mobile/dashboard',
      headers: { Authorization: 'Bearer valid-token' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary.incidents).toBe(1);
  });

  it('allows public search', async () => {
    const response = await app.inject({ method: 'GET', url: '/search?q=lucidia' });
    expect(response.statusCode).toBe(200);
  });

  it('applies rate limiting', async () => {
    const hits = await Promise.all(
      Array.from({ length: 6 }).map(() => app.inject({ method: 'GET', url: '/health' }))
    );

    const tooMany = hits.find((r) => r.statusCode === 429);
    expect(tooMany).toBeDefined();
    expect(tooMany?.headers['retry-after']).toBeDefined();
  });
});
