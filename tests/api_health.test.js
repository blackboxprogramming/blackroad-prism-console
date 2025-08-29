<!-- FILE: tests/api_health.test.js -->
process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');

describe('API security and health', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('responds to /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('validates login payload', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
  });
});
