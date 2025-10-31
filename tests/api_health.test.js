const test = require('node:test');
const assert = require('node:assert/strict');

const { createServer } = require('../srv/blackroad-api/server_full.js');
const { getAuthCookie } = require('./helpers/auth.js');

const allowedOrigin = 'https://example.com';

async function withServer(options, callback) {
  const { server } = createServer(options);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback({ baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /health responds with ok', async () => {
  await withServer(
    { sessionSecret: 'test-session-secret', allowedOrigins: [allowedOrigin] },
    async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: allowedOrigin },
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
      assert.ok(response.headers.get('x-request-id'));
    }
  );
});

test('GET /api/health applies security headers', async () => {
  await withServer(
    { sessionSecret: 'test-session-secret', allowedOrigins: [allowedOrigin] },
    async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: allowedOrigin },
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.equal(response.headers.get('x-dns-prefetch-control'), 'off');
      assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
    }
  );
});

test('authenticated task creation succeeds', async () => {
  await withServer({ sessionSecret: 'test-session-secret' }, async ({ baseUrl }) => {
    const cookie = await getAuthCookie(baseUrl);

    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie.join('; '),
      },
      body: JSON.stringify({ title: 'Ship secure endpoint' }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.task.title, 'Ship secure endpoint');
  });
});
