'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const sqlite = require('../json/sqlite');

const adapters = {
  sqlite,
};

function envelope(ok, data, meta) {
  if (ok) return { ok, data, meta };
  return { ok, error: data };
}

function parseQuery(q) {
  const params = {
    limit: q.limit,
    offset: q.offset,
    sort: q.sort,
    fields: q.fields ? String(q.fields).split(',').filter(Boolean) : undefined,
    filters: {},
  };
  for (const key of Object.keys(q)) {
    const m = key.match(/^filter\[(.+)\]$/);
    if (m) params.filters[m[1]] = q[key];
  }
  return params;
}

router.get('/health', (req, res) => {
  const payload = envelope(true, { status: 'ok' });
  const etag = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  res.set('ETag', `"${etag}"`);
  res.json(payload);
});

router.get('/:source/:resource', (req, res) => {
  const { source, resource } = req.params;
  const adapter = adapters[source];
  if (!adapter) return res.status(404).json(envelope(false, { code: 'NOT_FOUND', message: 'unknown source' }));
  try {
    const params = parseQuery(req.query);
    const { rows, count } = adapter.list(resource, params);
    const meta = { count, next: null, prev: null, source, resource };
    res.json(envelope(true, rows, meta));
  } catch (e) {
    res.status(500).json(envelope(false, { code: 'INTERNAL', message: e.message }));
  }
});

router.get('/:source/:resource/:id', (req, res) => {
  const { source, resource, id } = req.params;
  const adapter = adapters[source];
  if (!adapter) return res.status(404).json(envelope(false, { code: 'NOT_FOUND', message: 'unknown source' }));
  try {
    const row = adapter.get(resource, id);
    if (!row) return res.status(404).json(envelope(false, { code: 'NOT_FOUND', message: 'not found' }));
    const meta = { source, resource };
    res.json(envelope(true, row, meta));
  } catch (e) {
    res.status(500).json(envelope(false, { code: 'INTERNAL', message: e.message }));
  }
});

module.exports = router;
