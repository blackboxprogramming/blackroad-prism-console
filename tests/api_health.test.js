process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');

test.after(() => new Promise((resolve) => server.close(resolve)));

test('responds to /health', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('responds to /api/health with security headers', async () => {
  const res = await request(app)
    .get('/api/health')
    .set('Origin', 'https://example.com');
  assert.equal(res.status, 200);
  assert.equal(res.headers['x-dns-prefetch-control'], 'off');
  assert.equal(
    res.headers['access-control-allow-origin'],
    'https://example.com'
  );
});

test('validates login payload', async () => {
  const res = await request(app).post('/api/login').send({});
  assert.equal(res.status, 400);
});
