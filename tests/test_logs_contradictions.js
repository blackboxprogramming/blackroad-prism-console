const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const express = require('../backend/node_modules/express');

const dbPath = path.join(__dirname, 'tmp', 'monitor.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
process.env.DB_PATH = dbPath;

const db = require('../src/db');
db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)').run(
  'u1',
  'svc@example.com',
  'x',
  'service'
);

const logsRouter = require('../src/routes/logs');
const contradictionsRouter = require('../src/routes/contradictions');

function auth(req, _res, next) {
  req.session = { userId: 'u1' };
  next();
}

const appLogs = express();
appLogs.use(express.json());
appLogs.use(auth);
appLogs.use('/logs', logsRouter);

const appContr = express();
appContr.use(express.json());
appContr.use(auth);
appContr.use('/contradictions', contradictionsRouter);

test('insert and retrieve logs', async () => {
  const server = appLogs.listen(0);
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
  const server = appContr.listen(0);
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
