const assert = require('node:assert/strict');
const fetch = global.fetch;
const { JWT_SECRET } = require('../backend/auth');
const { server } = require('../backend/server');

const base = 'http://localhost:4000/api';

async function run() {
  await new Promise(r => setTimeout(r, 300));

  // signup
  let res = await fetch(base + '/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'password' })
  });
  let body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.token);
  const userId = body.user.id;

  // login
  res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'password' })
  });
  body = await res.json();
  const token = body.token;
  assert.ok(token);

  // access protected route
  res = await fetch(base + '/tasks', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);

  // invalid token
  res = await fetch(base + '/tasks', { headers: { Authorization: 'Bearer badtoken' } });
  assert.equal(res.status, 401);

  // expired token
  const jwt = require('jsonwebtoken');
  const expired = jwt.sign({ id: 'x', role: 'user' }, JWT_SECRET, { expiresIn: -1 });
  res = await fetch(base + '/tasks', { headers: { Authorization: `Bearer ${expired}` } });
  assert.equal(res.status, 401);

  // admin-only delete
  // normal user should fail
  res = await fetch(base + `/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 403);

  // admin login
  res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpass' })
  });
  body = await res.json();
  const adminToken = body.token;
  assert.ok(adminToken);

  res = await fetch(base + `/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(res.status, 200);
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
