'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { service } = req.query;
  let rows;
  if (service) {
    rows = db
      .prepare('SELECT * FROM logs WHERE service = ? ORDER BY timestamp DESC LIMIT 500')
      .all(service);
  } else {
    rows = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500').all();
  }
  res.json({ ok: true, logs: rows });
});

router.post('/', requireRole('service', 'admin'), (req, res) => {
  const { service, level, message } = req.body || {};
  if (!service || !level || !message) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const id = cryptoRandomId();
  db.prepare('INSERT INTO logs (id, service, level, message) VALUES (?, ?, ?, ?)').run(
    id,
    service,
    level,
    message
  );
  res.json({ ok: true, id });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
