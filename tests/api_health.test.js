process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');
// Helper to obtain an auth cookie for requests requiring authentication
const { getAuthCookie } = require('./helpers/auth');

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
    const cookie = await getAuthCookie(app);
    const res = await request(app)
      .get('/api/billing/entitlements/me')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.planName).toBe('Free');
    expect(res.body.entitlements.can.math.pro).toBe(false);
  });

  it('computes curvature', async () => {
    const res = await request(app).get('/api/trust/curvature');
    expect(res.status).toBe(200);
    const edge = res.body.find((e) => e.u === 'a' && e.v === 'b');
    expect(edge.kappa).toBeGreaterThan(0);
  });

  it('computes CTD between two truths', async () => {
    const res = await request(app)
      .get('/api/truth/diff')
      .query({ cid: ['a', 'b'] });
    expect(res.status).toBe(200);
    expect(res.body.ctd).toBe(1);
    expect(res.body.ops[0].path).toBe('/meta/title');
  });
});
