import { describe, expect, it, vi } from 'vitest';

describe('OpenAPI contract', () => {
  it('includes core routes', async () => {
    vi.resetModules();
    process.env.GATEWAY_PORT = '0';
    process.env.GATEWAY_ENV = 'test';
    process.env.GATEWAY_LOG_LEVEL = 'silent';
    process.env.AUTH_BASE_URL = 'http://auth.test';
    process.env.ROADGLITCH_BASE_URL = 'http://roadglitch.test';
    process.env.CONSOLE_BASE_URL = 'http://console.test';
    process.env.SEARCH_BASE_URL = 'http://search.test';
    process.env.METRICS_ENABLED = 'false';

    const { buildServer } = await import('../../src/app.js');
    const app = await buildServer();
    await app.ready();
    const doc = app.swagger();

    expect(doc.paths['/health']).toBeDefined();
    expect(doc.paths['/automation/runs']).toBeDefined();
    expect(doc.paths['/console/mobile/dashboard']).toBeDefined();
    await app.close();
  });
});
