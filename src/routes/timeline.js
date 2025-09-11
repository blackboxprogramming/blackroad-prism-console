'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM timeline_events ORDER BY created_at DESC LIMIT 500').all();
  res.json({ ok: true, events: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { type, entity_type, entity_id, data } = req.body || {};
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO timeline_events (id, type, entity_type, entity_id, data)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, type || null, entity_type || null, entity_id || null, data ? JSON.stringify(data) : null);
  res.json({ ok: true, id });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
