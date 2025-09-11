process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
process.env.GIT_REPO_PATH = process.cwd();

const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');

describe('Git API', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('returns git health info', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ username: 'root', password: 'Codex2025' });
    const cookie = login.headers['set-cookie'];
    const res = await request(app)
      .get('/api/git/health')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.repoPath).toBe('string');
    expect(res.body.readOnly).toBe(true);
  });

  it('returns git status info', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ username: 'root', password: 'Codex2025' });
    const cookie = login.headers['set-cookie'];
    const res = await request(app)
      .get('/api/git/status')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.branch).toBe('string');
    expect(typeof res.body.shortHash).toBe('string');
    expect(typeof res.body.ahead).toBe('number');
    expect(typeof res.body.behind).toBe('number');
  });
});
