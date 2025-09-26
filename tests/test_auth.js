const assert = require('node:assert/strict');
const fetch = global.fetch;
const express = require('../backend/node_modules/express');
const { signup, login, requireAuth, JWT_SECRET } = require('../backend/auth');
const { getDb } = require('../backend/data');

const app = express();
app.use(express.json());
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.get('/api/tasks', requireAuth, (_req, res) => res.json({ ok: true }));

const server = app.listen(0);
const base = `http://localhost:${server.address().port}/api`;

async function run() {
  await new Promise(r => setTimeout(r, 300));

  // signup
  const email = `alice-${Date.now()}@example.com`;
  let res = await fetch(base + '/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' })
  });
  let body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.token);
  const userId = body.user.id;

  // verify password hashed in DB
  const row = getDb().prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
  assert.notEqual(row.password_hash, 'password');

  // login
  res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' })
  });
  body = await res.json();
  const token = body.token;
  assert.ok(token);

  // access protected route
  res = await fetch(base + '/tasks', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);

  // invalid token
  res = await fetch(base + '/tasks', { headers: { Authorization: 'Bearer badtoken' } });
  assert.equal(res.status, 403);

  // expired token
  const jwt = require('../backend/node_modules/jsonwebtoken');
  const expired = jwt.sign({ id: 'x', role: 'user' }, JWT_SECRET, { expiresIn: -1 });
  res = await fetch(base + '/tasks', { headers: { Authorization: `Bearer ${expired}` } });
  assert.equal(res.status, 403);

  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
