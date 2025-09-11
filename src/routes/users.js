'use strict';

const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, email, name, role, is_active, created_at, updated_at, last_login_at FROM users ORDER BY created_at DESC').all();
  res.json({ ok: true, users: rows });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { role, name, is_active } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!u) return res.status(404).json({ ok: false, error: 'not_found' });
  db.prepare(`
    UPDATE users
    SET role = COALESCE(?, role),
        name = COALESCE(?, name),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(role || null, name || null, (typeof is_active === 'boolean') ? (is_active ? 1 : 0) : null, id);
  const updated = db.prepare('SELECT id, email, name, role, is_active FROM users WHERE id = ?').get(id);
  res.json({ ok: true, user: updated });
});

module.exports = router;
