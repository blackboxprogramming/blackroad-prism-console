process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
process.env.PORT = '0';

const { once } = require('node:events');
const test = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('../srv/blackroad-api/server_full.js');

async function getBaseUrl() {
  if (!server.listening) {
    await once(server, 'listening');
  }
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test.after(() => new Promise((resolve) => server.close(resolve)));

test('responds to /health', async () => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('responds to /api/health with security headers', async () => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://example.com' }
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-dns-prefetch-control'), 'off');
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://example.com');
});

test('validates login payload', async () => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
});
