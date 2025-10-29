'use strict';

const express = require('express');
const cors = require('cors');

function normalizeTags(tags) {
  if (tags == null) {
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

function createMemoryApp({ store = null, persister, webdavClient = null, logger = console } = {}) {
  if (!persister) {
    throw new Error('persister is required to create the memory app');
  }

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  function formatEntry(entry) {
    if (!entry) {
      return entry;
    }

    return {
      id: entry.id,
      text: entry.text,
      source: entry.source || 'unknown',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      created_at: entry.created_at,
      score: entry.score ?? null,
    };
  }

  app.get('/health', (_req, res) => {
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
      res.status(201).json({ ok: true, ...result });
    } catch (error) {
      logger.error('[memory] failed to index memory', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post('/api/memory/search', async (req, res) => {
    try {
      const { q = '', top_k = 10 } = req.body || {};
      const query = typeof q === 'string' ? q.trim() : '';
      const limit = Math.max(1, Math.min(50, parseInt(top_k, 10) || 10));

      const results = persister.search(query, limit).map(formatEntry);
      res.json({ ok: true, results });
    } catch (error) {
      logger.error('[memory] search failed', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/memory/stats', (_req, res) => {
    try {
      const stats = {
        store: store && typeof store.getStats === 'function' ? store.getStats() : null,
        webdav: webdavClient && typeof webdavClient.getStatus === 'function' ? webdavClient.getStatus() : null,
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
