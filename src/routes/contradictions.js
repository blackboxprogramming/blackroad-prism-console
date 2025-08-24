// FILE: /srv/blackroad-api/src/routes/contradictions.js
'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, module, description, timestamp FROM contradictions ORDER BY timestamp DESC LIMIT 500')
    .all();
  res.json({ ok: true, contradictions: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { module, description } = req.body || {};
  if (!module || !description) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const id = cryptoRandomId();
  db.prepare('INSERT INTO contradictions (id, module, description) VALUES (?, ?, ?)').run(
    id,
    module,
    description
  );
  res.json({ ok: true, id });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
