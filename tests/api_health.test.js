process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
process.env.DB_PATH = ':memory:';
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');

describe('API smoke tests', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('returns 200 on /api/health', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('sets security headers', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://example.com'
    );
  });
});
