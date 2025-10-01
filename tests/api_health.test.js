process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
process.env.MATH_ENGINE_URL = '';
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');

describe('API security and health', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('responds to /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('responds to /api/health with security headers', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    expect(res.status).toBe(200);
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://example.com'
    );
  });

  it('validates login payload', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
  });

  it('reports math engine unavailable when not configured', async () => {
    const res = await request(app).get('/api/math/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, error: 'engine_unavailable' });
  });

  it('blocks math evaluation when engine is unavailable', async () => {
    const res = await request(app).post('/api/math/eval').send({ expr: '2+2' });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'engine_unavailable' });
  });
});
