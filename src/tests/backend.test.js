const fs = require('fs');
const path = require('path');
const request = require('supertest');

const DB_PATH = '/tmp/blackroad_test.db';

let app;
let userCookie;
let adminCookie;
let projectId;
let agentId;
let contradictionId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = DB_PATH;
  process.env.SESSION_SECRET = 'test-secret';
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  app = require('../../server_full');
});

afterAll(() => {
  const db = require('../db');
  try {
    db.close();
  } catch {}
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

describe('Auth', () => {
  test('user can register, login, and access /me', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'secret', name: 'User' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('user@example.com');
    userCookie = res.headers['set-cookie'];

    const meRes = await request(app).get('/api/auth/me').set('Cookie', userCookie);
    expect(meRes.body.user.email).toBe('user@example.com');

    await request(app).post('/api/auth/logout').set('Cookie', userCookie);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'secret' });
    expect(loginRes.status).toBe(200);
    userCookie = loginRes.headers['set-cookie'];
  });

  test('auth-protected route denies unauthenticated access', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

describe('Projects CRUD', () => {
  test('create and list projects', async () => {
    const create = await request(app)
      .post('/api/lucidia/projects')
      .set('Cookie', userCookie)
      .send({ title: 'Test Project' });
    expect(create.status).toBe(200);
    projectId = create.body.id;

    const list = await request(app).get('/api/lucidia/projects').set('Cookie', userCookie);
    expect(list.body.projects.some((p) => p.id === projectId)).toBe(true);
  });
});

describe('Tasks CRUD and validation', () => {
  test('rejects empty task title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', userCookie)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('create, update, delete task with persistence', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Cookie', userCookie)
      .send({ title: 'Task A' });
    expect(create.status).toBe(200);
    const taskId = create.body.task.id;

    let list = await request(app).get('/api/tasks').set('Cookie', userCookie);
    expect(list.body.tasks.some((t) => t.id === taskId)).toBe(true);

    await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Cookie', userCookie)
      .send({ status: 'done' });
    list = await request(app).get('/api/tasks').set('Cookie', userCookie);
    expect(list.body.tasks.find((t) => t.id === taskId).status).toBe('done');

    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Cookie', userCookie);
    list = await request(app).get('/api/tasks').set('Cookie', userCookie);
    expect(list.body.tasks.find((t) => t.id === taskId)).toBeUndefined();
  });
});

describe('Logs and Contradictions', () => {
  test('logs and contradictions APIs enforce roles and persist data', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'root@blackroad.io', password: 'Codex2025' });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.headers['set-cookie'];

    const failAgent = await request(app)
      .post('/api/agents')
      .set('Cookie', userCookie)
      .send({ slug: 'a1', name: 'Agent1' });
    expect(failAgent.status).toBe(403);

    const createAgent = await request(app)
      .post('/api/agents')
      .set('Cookie', adminCookie)
      .send({ slug: 'agent', name: 'Agent' });
    expect(createAgent.status).toBe(200);
    agentId = createAgent.body.agent.id;
    expect(createAgent.body.agent.location).toBe('local');

    const logRes = await request(app)
      .post(`/api/agents/${agentId}/logs`)
      .set('Cookie', userCookie)
      .send({ message: 'hello' });
    expect(logRes.status).toBe(200);
    const logs = await request(app)
      .get(`/api/agents/${agentId}/logs`)
      .set('Cookie', userCookie);
    expect(logs.body.logs.some((l) => l.message === 'hello')).toBe(true);

    const cRes = await request(app)
      .post('/api/contradictions')
      .set('Cookie', userCookie)
      .send({ description: 'issue' });
    expect(cRes.status).toBe(200);
    contradictionId = cRes.body.id;

    const failResolve = await request(app)
      .post(`/api/contradictions/${contradictionId}/resolve`)
      .set('Cookie', userCookie);
    expect(failResolve.status).toBe(403);

    const resolve = await request(app)
      .post(`/api/contradictions/${contradictionId}/resolve`)
      .set('Cookie', adminCookie);
    expect(resolve.status).toBe(200);
  });

  test('bad session cookie yields 401', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Cookie', 'brsid=bad');
    expect(res.status).toBe(401);
  });
});
