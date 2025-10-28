process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
process.env.MINT_PK = '0x' + '1'.repeat(64);
process.env.ETH_RPC_URL = 'http://127.0.0.1:8545';
const fs = require('fs');
const path = require('path');
const originKeyPath = path.join(__dirname, 'origin.key');
fs.writeFileSync(originKeyPath, 'test-origin-key');
process.env.ORIGIN_KEY_PATH = originKeyPath;
jest.mock(
  'compression',
  () => () => (_req, _res, next) => next(),
  { virtual: true }
);
jest.mock(
  'express-validator',
  () => {
    const wrap = () => {
      const middleware = (_req, _res, next) => next();
      middleware.isString = () => middleware;
      middleware.isEmail = () => middleware;
      middleware.trim = () => middleware;
      middleware.escape = () => middleware;
      return middleware;
    };
    return {
      body: wrap,
      validationResult: (req) => ({
        isEmpty: () =>
          typeof req.body?.username === 'string' &&
          typeof req.body?.password === 'string',
        array: () => [],
      }),
    };
  },
  { virtual: true }
);
jest.mock(
  'winston',
  () => {
    const logger = {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
      child: () => logger,
    };
    const format = {
      json: () => () => {},
      simple: () => () => {},
    };
    function Console() {}
    function File() {}
    return {
      createLogger: () => logger,
      format,
      transports: { Console, File },
    };
  },
  { virtual: true }
);
// FILE: tests/api_health.test.js

jest.mock('better-sqlite3', () => {
  const mockRun = jest.fn(() => ({ lastInsertRowid: 1 }));
  return jest.fn(() => ({
    pragma: jest.fn(),
    prepare: jest.fn((sql) => {
      const stmt = {
        run: mockRun,
        get: jest.fn(() => undefined),
        all: jest.fn(() => []),
      };
      if (/COUNT\(\*\)/i.test(sql)) {
        stmt.get = jest.fn(() => ({ c: 0 }));
      }
      return stmt;
    }),
    close: jest.fn(),
  }));
});
process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
const request = require('supertest');
const { app, server } = require('../srv/blackroad-api/server_full.js');
const originHeaders = { 'X-BlackRoad-Key': 'test-origin-key' };
const { getAuthCookie } = require('./helpers/auth.js');
// Login helper reused across tests to obtain authenticated cookies.
const { getAuthCookie } = require('./helpers/auth');

describe('API security and health', () => {
  afterAll((done) => {
    server.close(() => {
      fs.rm(originKeyPath, { force: true }, () => done());
    });
  });

  it('responds to /health', async () => {
    const res = await request(app).get('/health').set(originHeaders);
process.env.MATH_ENGINE_URL = '';
process.env.DB_PATH = ':memory:';
const request = require('supertest');
const { app, shutdown } = require('../srv/blackroad-api/server_full.js');

describe('API smoke tests', () => {
  afterAll((done) => {
    shutdown(done);
  });

  it('returns 200 on /api/health', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('sets security headers', async () => {
    const res = await request(app)
      .get('/api/health')
      .set(originHeaders)
      .set('Origin', 'https://example.com');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://example.com'
    );
  });

  it('validates login payload', async () => {
    const res = await request(app)
      .post('/api/login')
      .set(originHeaders)
      .send({});
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns security headers on /api/health', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    expect(res.status).toBe(200);
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://example.com'
    );
  });

  it('returns default entitlements for logged-in user', async () => {
    const login = await request(app)
      .post('/api/login')
      .set(originHeaders)
      .send({ username: 'root', password: 'Codex2025' });
    const cookie = login.headers['set-cookie'];
    const cookie = await getAuthCookie();
    const cookie = await getAuthCookie(app);
    const res = await request(app)
      .get('/api/billing/entitlements/me')
      .set(originHeaders)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.planName).toBe('Free');
    expect(res.body.entitlements.can.math.pro).toBe(false);
  });

  it('computes curvature', async () => {
    const res = await request(app)
      .get('/api/trust/curvature')
      .set(originHeaders);
    expect(res.status).toBe(200);
    const edge = res.body.find((e) => e.u === 'a' && e.v === 'b');
    expect(edge.kappa).toBeGreaterThan(0);
  });

  it('computes CTD between two truths', async () => {
    const res = await request(app)
      .get('/api/truth/diff')
      .set(originHeaders)
      .query({ cid: ['a', 'b'] });
    expect(res.status).toBe(200);
    expect(res.body.ctd).toBe(1);
    expect(res.body.ops[0].path).toBe('/meta/title');
  });

  it('groups connector configuration and live status', async () => {
    const res = await request(app)
      .get('/api/connectors/status')
      .set(originHeaders);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      config: {
        stripe: false,
        mail: false,
        sheets: false,
        calendar: false,
        discord: false,
        webhooks: false,
      },
      live: {
        slack: false,
        airtable: false,
        linear: false,
        salesforce: false,
      },
    });
  it('exposes seeded quantum research summaries', async () => {
    const list = await request(app).get('/api/quantum');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.topics)).toBe(true);
    expect(list.body.topics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ topic: 'reasoning' }),
        expect.objectContaining({ topic: 'memory' }),
        expect.objectContaining({ topic: 'symbolic' }),
      ]),
    );

    const detail = await request(app).get('/api/quantum/reasoning');
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual(
      expect.objectContaining({
        topic: 'reasoning',
      }),
    );
    expect(detail.body.summary).toMatch(/Quantum/i);
  it('reports math engine unavailable when not configured', async () => {
    const res = await request(app).get('/api/math/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, error: 'engine_unavailable' });
  });

  it('blocks math evaluation when engine is unavailable', async () => {
    const res = await request(app).post('/api/math/eval').send({ expr: '2+2' });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'engine_unavailable' });
  });
});
