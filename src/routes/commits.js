'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM commits ORDER BY created_at DESC LIMIT 500').all();
  res.json({ ok: true, commits: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { repo, branch, hash, author, message } = req.body || {};
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO commits (id, repo, branch, hash, author, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, repo || null, branch || null, hash || null, author || null, message || null);
  res.json({ ok: true, id });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
