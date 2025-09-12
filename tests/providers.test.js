process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');

describe('Provider registry', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('lists configured providers', async () => {
    const res = await request(app).get('/v1/providers');
    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.id);
    expect(names).toContain('openai');
  });

  it('returns health for a provider', async () => {
    const res = await request(app).get('/v1/providers/openai/health');
    expect(res.status).toBe(200);
    expect(typeof res.body.ok).toBe('boolean');
  });
});
