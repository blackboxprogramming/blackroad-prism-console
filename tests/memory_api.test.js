const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { createMemoryStore } = require('../srv/blackroad-api/memory/store');
const { createMemoryApp } = require('../srv/blackroad-api/memory/app');

function createTempDbPath() {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return path.join(os.tmpdir(), `memory-api-${id}.db`);
}

describe('Memory API', () => {
  let store;
  let app;
  let dbPath;

  beforeEach(async () => {
    dbPath = createTempDbPath();
    store = createMemoryStore(dbPath);
    ({ app } = createMemoryApp({ store }));
    await store.ready;
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    if (dbPath && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  test('indexes and searches memories', async () => {
    const joinCode = 'CECILIA::ALIVE-CHI-2025-10-28::R04D';
    const indexResponse = await request(app)
      .post('/api/memory/index')
      .send({
        text: `[JOIN:${joinCode}] bootstrap memory`,
        source: 'cecilia',
        tags: ['cecilia', 'bootstrap'],
      })
      .expect(201);

    expect(indexResponse.body.ok).toBe(true);
    expect(indexResponse.body.entry).toMatchObject({
      source: 'cecilia',
    });

    const searchResponse = await request(app)
      .post('/api/memory/search')
      .send({ q: joinCode, top_k: 5 })
      .expect(200);

    expect(searchResponse.body.ok).toBe(true);
    expect(searchResponse.body.results.length).toBeGreaterThanOrEqual(1);
    expect(searchResponse.body.results[0].text).toContain(joinCode);
  });

  test('validates payloads', async () => {
    const res = await request(app)
      .post('/api/memory/index')
      .send({})
      .expect(400);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/text/i);
  });
});
