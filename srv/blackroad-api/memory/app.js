const express = require('express');
const cors = require('cors');
const { createMemoryStore, DEFAULT_MEMORY_DB_PATH } = require('./store');

function createMemoryApp(options = {}) {
  const store = options.store || createMemoryStore(options.dbPath || process.env.MEMORY_DB_PATH || DEFAULT_MEMORY_DB_PATH);
'use strict';

const express = require('express');
const cors = require('cors');

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }
  if (!Array.isArray(tags)) {
    throw new Error('tags must be an array of strings');
  }
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .slice(0, 25);
}

function createMemoryApp({ store, persister, webdavClient = null, logger = console }) {
  if (!persister) {
    throw new Error('persister is required to create the memory app');
  }

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
  app.get('/health', async (req, res) => {
    try {
      const stats = persister.getStats();
      res.json({ ok: true, stats });
    } catch (error) {
      logger.error('[memory] health check failed', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post('/api/memory/index', async (req, res) => {
    try {
      const { text, source, tags } = req.body || {};
      const entry = await store.indexMemory({ text, source, tags });
      res.status(201).json({ ok: true, entry: formatEntry(entry) });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message || 'Failed to index memory' });
      const { text, source = 'unknown', tags = [], join_code = null, metadata = null } = req.body || {};

      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'text is required' });
      }

      let normalizedTags;
      try {
        normalizedTags = normalizeTags(tags);
      } catch (error) {
        return res.status(400).json({ ok: false, error: error.message });
      }

      const payload = {
        text: text.trim(),
        source,
        tags: normalizedTags,
        join_code,
        metadata,
      };

      const result = await persister.indexMemory(payload);
      res.json({ ok: true, ...result });
    } catch (error) {
      logger.error('[memory] failed to index memory', error);
      res.status(500).json({ ok: false, error: error.message });
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
      const { q, top_k = 10 } = req.body || {};

      if (typeof q !== 'string' || !q.trim()) {
        return res.status(400).json({ ok: false, error: 'q is required' });
      }

      const limit = Math.max(1, Math.min(50, parseInt(top_k, 10) || 10));
      const results = persister.search(q.trim(), limit);
      res.json({ ok: true, results });
    } catch (error) {
      logger.error('[memory] search failed', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/memory/stats', async (req, res) => {
    try {
      const stats = {
        store: store ? store.getStats() : null,
        webdav: webdavClient ? webdavClient.getStatus() : null,
      };
      res.json({ ok: true, stats });
    } catch (error) {
      logger.error('[memory] stats endpoint failed', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  return app;
}

module.exports = {
  createMemoryApp,
};
