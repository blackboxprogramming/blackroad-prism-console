const fs = require('fs');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const { DB_FILE } = require('../backend/migrate');
try { fs.unlinkSync(DB_FILE); } catch {}

const { app, server } = require('../backend/server');

afterAll(() => {
  server.close();
  try { fs.unlinkSync(DB_FILE); } catch {}
});

describe('integration flow', () => {
  let token;
  let projectId;

  test('signup -> login -> protected route', async () => {
    let res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'alice', password: 'password' });
    expect(res.status).toBe(200);

    res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'password' });
    expect(res.status).toBe(200);
    token = res.body.token;
    projectId = res.body.user.projectId;

    res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('auth rejection without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  test('project/task CRUD end-to-end', async () => {
    let res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', projectId });
    expect(res.status).toBe(201);
    const id = res.body.task.id;

    res = await request(app)
      .patch(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });
    expect(res.status).toBe(200);

    res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('log and contradiction inserts', async () => {
    const express = require('express');
    const logsRouter = require('../src/routes/logs');
    const contradictionsRouter = require('../src/routes/contradictions');

    function auth(req, _res, next) {
      req.session = { userId: 'u1' };
      next();
    }

    const app2 = express();
    app2.use(express.json());
    app2.use(auth);
    app2.use('/logs', logsRouter);
    app2.use('/contradictions', contradictionsRouter);

    let res = await request(app2)
      .post('/logs')
      .send({ service: 'api', level: 'info', message: 'hello' });
    expect(res.status).toBe(200);

    res = await request(app2)
      .post('/contradictions')
      .send({ module: 'math', description: 'divergent result' });
    expect(res.status).toBe(200);
  });
});
