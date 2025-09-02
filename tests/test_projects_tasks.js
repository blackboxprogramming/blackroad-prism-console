const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'prism-db-')), 'test.db');

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config');
const db = require('../src/db');
const routes = require('../src/routes');

const app = express();
app.use(express.json());
app.use('/', routes);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

async function api(method, url, body, token) {
  const res = await fetch(base + url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
}

test('projects and tasks CRUD', async () => {
  // register two users
  let r = await api('POST', '/auth/register', {
    email: 'a@example.com',
    password: 'pw',
    name: 'A',
  });
  assert.equal(r.status, 200);
  const userA = r.json.user;
  const tokenA = signToken({ id: userA.id, role: 'user' });

  r = await api('POST', '/auth/register', {
    email: 'b@example.com',
    password: 'pw',
    name: 'B',
  });
  assert.equal(r.status, 200);
  const userB = r.json.user;
  const tokenB = signToken({ id: userB.id, role: 'user' });

  // admin token
  const adminRow = db
    .prepare('SELECT id, role FROM users WHERE email = ?')
    .get('root@blackroad.io');
  const tokenAdmin = signToken(adminRow);

  // create project
  r = await api('POST', '/projects', { name: 'proj1' }, tokenA);
  assert.equal(r.status, 200);
  const projectId = r.json.project.id;

  // duplicate project name
  r = await api('POST', '/projects', { name: 'proj1' }, tokenA);
  assert.equal(r.status, 409);

  // list projects
  r = await api('GET', '/projects', null, tokenA);
  assert.equal(r.json.projects.length, 1);

  // other user cannot get project
  r = await api('GET', `/projects/${projectId}`, null, tokenB);
  assert.equal(r.status, 403);

  // admin can get project
  r = await api('GET', `/projects/${projectId}`, null, tokenAdmin);
  assert.equal(r.status, 200);

  // create task
  r = await api('POST', `/projects/${projectId}/tasks`, { title: 'task1' }, tokenA);
  assert.equal(r.status, 200);
  const taskId = r.json.task.id;

  // list tasks
  r = await api('GET', `/projects/${projectId}/tasks`, null, tokenA);
  assert.equal(r.json.tasks.length, 1);

  // other user cannot list tasks
  r = await api('GET', `/projects/${projectId}/tasks`, null, tokenB);
  assert.equal(r.status, 403);

  // update task
  r = await api('PUT', `/tasks/${taskId}`, { status: 'done' }, tokenA);
  assert.equal(r.status, 200);
  assert.equal(r.json.task.status, 'done');

  // other user cannot delete task
  r = await api('DELETE', `/tasks/${taskId}`, null, tokenB);
  assert.equal(r.status, 403);

  // admin deletes task
  r = await api('DELETE', `/tasks/${taskId}`, null, tokenAdmin);
  assert.equal(r.status, 200);

  // non-owner cannot delete project
  r = await api('DELETE', `/projects/${projectId}`, null, tokenB);
  assert.equal(r.status, 403);

  // admin deletes project
  r = await api('DELETE', `/projects/${projectId}`, null, tokenAdmin);
  assert.equal(r.status, 200);

  await new Promise((resolve) => server.close(resolve));
});
