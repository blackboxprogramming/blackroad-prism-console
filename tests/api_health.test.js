process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
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

  it('returns default entitlements for logged-in user', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ username: 'root', password: 'Codex2025' });
    const cookie = login.headers['set-cookie'];
    const res = await request(app)
      .get('/api/billing/entitlements/me')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.planName).toBe('Free');
    expect(res.body.entitlements.can.math.pro).toBe(false);
  });

  it('exposes seeded quantum research summaries', async () => {
    const list = await request(app).get('/api/quantum');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.topics)).toBe(true);
    expect(list.body.topics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ topic: 'reasoning' }),
        expect.objectContaining({ topic: 'memory' }),
        expect.objectContaining({ topic: 'symbolic' }),
      ]),
    );

    const detail = await request(app).get('/api/quantum/reasoning');
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual(
      expect.objectContaining({
        topic: 'reasoning',
      }),
    );
    expect(detail.body.summary).toMatch(/Quantum/i);
  });
});
