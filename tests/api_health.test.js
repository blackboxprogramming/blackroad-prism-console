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

describe('API security and health', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('responds to /health', async () => {
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
});
