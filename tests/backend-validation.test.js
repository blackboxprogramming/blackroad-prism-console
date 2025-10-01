const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
const { app } = require('../backend/server');

function getPort(server) {
  return server.address().port;
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function getToken(port) {
  const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'root', password: 'Codex2025' })
  });
  assert.equal(loginRes.status, 200);
  assert.match(loginRes.headers.get('content-type'), /^application\/json/);

  const loginJson = await loginRes.json();
  assert.ok(loginJson.token, 'expected login token');
  return loginJson.token;
}

test('rejects malformed json and missing fields', async () => {
  const server = app.listen(0);
  const port = getPort(server);
  try {
    const token = await getToken(port);

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
    assert.match(badRes.headers.get('content-type'), /^application\/json/);
    const badJson = await badRes.json();
    assert.equal(badJson.error, 'invalid json');

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
    assert.match(missRes.headers.get('content-type'), /^application\/json/);
    const missJson = await missRes.json();
    assert.equal(missJson.error, 'invalid task');
  } finally {
    await closeServer(server);
  }
});

test('returns json for not found routes', async () => {
  const server = app.listen(0);
  const port = getPort(server);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/nope`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type'), /^application\/json/);
    const body = await res.json();
    assert.equal(body.error, 'not found');
  } finally {
    await closeServer(server);
  }
});

