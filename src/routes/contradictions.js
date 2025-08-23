// FILE: /srv/blackroad-api/src/routes/contradictions.js
'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM contradictions ORDER BY created_at DESC LIMIT 500').all();
  res.json({ ok: true, contradictions: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { source, description, severity } = req.body || {};
  if (!description) return res.status(400).json({ ok: false, error: 'missing_description' });
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO contradictions (id, source, description, severity, resolved)
    VALUES (?, ?, ?, COALESCE(?, 3), 0)
  `).run(id, source || null, description, severity || null);
  res.json({ ok: true, id });
});

router.post('/:id/resolve', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.prepare('UPDATE contradictions SET resolved = 1 WHERE id = ?').run(id);
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
