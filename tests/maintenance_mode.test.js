process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';

const request = require('supertest');

describe('maintenance mode global switch', () => {
  let app;
  let server;

  beforeAll(() => {
    process.env.AUTOPAL_GLOBAL_ENABLED = 'false';
    ({ app, server } = require('../srv/blackroad-api/server_full.js'));
  });

  afterAll((done) => {
    delete process.env.AUTOPAL_GLOBAL_ENABLED;
    server.close(done);
  });

  it('allows live health endpoint when disabled globally', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.headers['cache-control']).toBe('max-age=10');
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.ts).toBe('string');
  });

  it('allows ready health endpoint when disabled globally', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.body.status).toBe('ok');
  });

  it('blocks non-allowlisted GET with retry-after', async () => {
    const res = await request(app).get('/lines/open?service=ingest');
    expect(res.status).toBe(503);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.headers['retry-after']).toBe('60');
    expect(res.body).toMatchObject({
      code: 'maintenance_mode',
      message: 'AutoPal is paused by ops.',
      hint: 'Try again later or use runbooks.',
      runbook: 'https://runbooks/autopal/maintenance',
    });
  });

  it('blocks secret resolution with specific message', async () => {
    const res = await request(app).post('/secrets/resolve');
    expect(res.status).toBe(503);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.headers['retry-after']).toBeUndefined();
    expect(res.body).toEqual({
      code: 'maintenance_mode',
      message: 'Secret operations are disabled by the global switch.',
    });
  });

  it('blocks materialization with 403', async () => {
    const res = await request(app).post('/secrets/materialize');
    expect(res.status).toBe(403);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.headers['retry-after']).toBeUndefined();
    expect(res.body).toEqual({
      code: 'materialize_disabled',
      message: 'Token minting disabled (global switch).',
    });
  });

  it('blocks fossil overrides with custom message', async () => {
    const res = await request(app).post('/fossil/override');
    expect(res.status).toBe(503);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.headers['retry-after']).toBeUndefined();
    expect(res.body).toEqual({
      code: 'maintenance_mode',
      message: 'Overrides are disabled while AutoPal is paused.',
    });
  });

  it('blocks unknown paths with maintenance payload', async () => {
    const res = await request(app).get('/totally/unknown');
    expect(res.status).toBe(503);
    expect(res.headers['x-autopal-mode']).toBe('maintenance');
    expect(res.headers['retry-after']).toBe('60');
    expect(res.body).toMatchObject({
      code: 'maintenance_mode',
      message: 'AutoPal is paused by ops.',
    });
  });
});
