const express = require('express');
const cors = require('cors');
const { createMemoryStore, DEFAULT_MEMORY_DB_PATH } = require('./store');

function createMemoryApp(options = {}) {
  const store = options.store || createMemoryStore(options.dbPath || process.env.MEMORY_DB_PATH || DEFAULT_MEMORY_DB_PATH);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  function formatEntry(entry) {
    if (!entry) return entry;
    return {
      id: entry.id,
      text: entry.text,
      source: entry.source,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      created_at: entry.created_at,
    };
  }

  app.get('/health', async (_req, res) => {
    try {
      const info = await store.stats();
      res.json({ ok: true, service: 'memory-api', db_path: info.path, total: info.count, ts: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message || 'Unable to read memory stats' });
    }
  });

  app.post('/api/memory/index', async (req, res) => {
    try {
      const { text, source, tags } = req.body || {};
      const entry = await store.indexMemory({ text, source, tags });
      res.status(201).json({ ok: true, entry: formatEntry(entry) });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message || 'Failed to index memory' });
    }
  });

  app.post('/api/memory/search', async (req, res) => {
    try {
      const { q, top_k: topK } = req.body || {};
      const results = await store.searchMemory({ query: q || '', limit: topK });
      res.json({ ok: true, results: results.map(formatEntry) });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message || 'Search failed' });
    }
  });

  return { app, store };
}

module.exports = { createMemoryApp };
