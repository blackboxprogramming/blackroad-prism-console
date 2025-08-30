const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
const { app } = require('../backend/server');

function getPort(server) {
  return server.address().port;
}

test('rejects malformed json and missing fields', async () => {
  const server = app.listen(0);
  const port = getPort(server);
  try {
    // login to get token
    const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'root', password: 'Codex2025' })
    });
    const loginJson = await loginRes.json();
    const token = loginJson.token;

    // malformed json
    const badRes = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: '{"title": "bad"' // missing closing brace
    });
    assert.equal(badRes.status, 400);

    // missing title field
    const missRes = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    assert.equal(missRes.status, 400);
  } finally {
    server.close();
  }
});

test('returns json for not found routes', async () => {
  const server = app.listen(0);
  const port = getPort(server);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/nope`);
    assert.equal(res.status, 404);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'));
    const body = await res.json();
    assert.equal(body.error, 'not found');
  } finally {
    server.close();
  }
});

