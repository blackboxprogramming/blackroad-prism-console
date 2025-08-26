const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const express = require('express');

const dbPath = path.join(__dirname, 'tmp', 'monitor.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
process.env.DB_PATH = dbPath;

const db = require('../src/db');
db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)').run('u1', 'svc@example.com', 'x', 'service');
db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)').run('a1', 'admin@example.com', 'x', 'admin');

const logsRouter = require('../src/routes/logs');
const contradictionsRouter = require('../src/routes/contradictions');

function makeApp(userId, router, mount) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.session = { userId };
    next();
  });
  app.use(mount, router);
  return app;
}

test('insert and retrieve logs', async () => {
  const app = makeApp('u1', logsRouter, '/logs');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/logs`;
  let res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'api', level: 'info', message: 'hello' })
  });
  assert.equal(res.status, 200);
  res = await fetch(`${base}?service=api`);
  const data = await res.json();
  assert.ok(data.logs.length >= 1);
  assert.equal(data.logs[0].service, 'api');
  assert.ok(data.logs[0].timestamp);
  server.close();
});

test('insert and retrieve contradictions', async () => {
  const app = makeApp('u1', contradictionsRouter, '/contradictions');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/contradictions`;
  let res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'math', description: 'divergent result' })
  });
  assert.equal(res.status, 200);
  res = await fetch(base);
  const data = await res.json();
  assert.ok(data.contradictions.length >= 1);
  assert.equal(data.contradictions[0].module, 'math');
  assert.ok(data.contradictions[0].timestamp);
  server.close();
});

test('unauthorized users blocked from delete', async () => {
  const app = makeApp('u1', contradictionsRouter, '/contradictions');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/contradictions`;
  let res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'test', description: 'temp' })
  });
  const body = await res.json();
  res = await fetch(`${base}/${body.id}`, { method: 'DELETE' });
  assert.equal(res.status, 403);
  server.close();
});

test('admin delete succeeded', async () => {
  const app = makeApp('a1', contradictionsRouter, '/contradictions');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/contradictions`;
  let res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'auth', description: 'cleanup' })
  });
  const body = await res.json();
  res = await fetch(`${base}/${body.id}`, { method: 'DELETE' });
  assert.equal(res.status, 200);
  res = await fetch(base);
  const data = await res.json();
  assert.ok(!data.contradictions.find(c => c.id === body.id));
  server.close();
});
