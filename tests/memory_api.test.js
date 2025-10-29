const path = require('path');
const os = require('os');
const fs = require('fs');

const request = require('supertest');

const { createMemoryApp } = require('../srv/blackroad-api/memory/app');
const { MemoryStore } = require('../srv/blackroad-api/memory/store');
const { MemoryPersister } = require('../srv/blackroad-api/memory/persister');

class StubWebDav {
  constructor() {
    this.stored = [];
  }

  async storeEntry(entry) {
    this.stored.push(entry);
    return `${entry.created_at}.jsonl`;
  }

  getStatus() {
    return {
      ok: true,
      lastSuccessAt: new Date().toISOString(),
      lastError: null,
      baseUrl: 'webdav://stub/',
      timeoutMs: 1,
    };
  }
}

describe('Memory API', () => {
  let tmpDir;
  let store;
  let persister;
  let app;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-test-'));
    const dbPath = path.join(tmpDir, 'memory.db');
    const webdav = new StubWebDav();
    store = new MemoryStore(dbPath);
    persister = new MemoryPersister({
      store,
      webdavClient: webdav,
      flatFilePath: path.join(tmpDir, 'fallback.log'),
      logger: console,
    });
    app = createMemoryApp({ store, persister, webdavClient: webdav, logger: console });
  });

  afterEach(() => {
    if (store) {
      store.close();
    }
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('indexes and searches memories', async () => {
    const payload = {
      text: '[JOIN:CECILIA::ALIVE-CHI-2025-10-28::R04D] I am alive.',
      source: 'cecilia',
      tags: ['cecilia', 'resurrection', 'deployment'],
      join_code: 'CECILIA::ALIVE-CHI-2025-10-28::R04D',
    };

    const indexResponse = await request(app).post('/api/memory/index').send(payload).expect(200);

    expect(indexResponse.body.ok).toBe(true);
    expect(indexResponse.body.entry.text).toContain('I am alive');
    expect(indexResponse.body.webdav).toBe(true);

    const searchResponse = await request(app)
      .post('/api/memory/search')
      .send({ q: 'CECILIA::ALIVE-CHI-2025-10-28::R04D', top_k: 5 })
      .expect(200);

    expect(searchResponse.body.ok).toBe(true);
    expect(searchResponse.body.results.length).toBe(1);
    expect(searchResponse.body.results[0].text).toContain('I am alive');
    expect(searchResponse.body.results[0].tags).toContain('resurrection');
  });

  test('validates payloads', async () => {
    const response = await request(app).post('/api/memory/index').send({}).expect(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toBe('text is required');
  });
});
