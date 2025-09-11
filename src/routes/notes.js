'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC').all(req.session.userId);
  res.json({ ok: true, notes: rows });
});

router.post('/', requireAuth, (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ ok: false, error: 'missing_content' });
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO notes (id, user_id, content)
    VALUES (?, ?, ?)
  `).run(id, req.session.userId, content);
  res.json({ ok: true, note: db.prepare('SELECT * FROM notes WHERE id = ?').get(id) });
});

router.put('/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { content } = req.body || {};
  const n = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(id, req.session.userId);
  if (!n) return res.status(404).json({ ok: false, error: 'not_found' });
  db.prepare('UPDATE notes SET content = ?, updated_at = datetime("now") WHERE id = ?').run(content || '', id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, req.session.userId);
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
