// FILE: /srv/blackroad-api/src/routes/tasks.js
'use strict';

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../../backend/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM tasks
    WHERE assignee_id = ? OR assignee_id IS NULL
    ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ ok: true, tasks: rows });
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description, status, priority, due_date } = req.body || {};
  if (!title) return res.status(400).json({ ok: false, error: 'missing_title' });
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assignee_id, due_date)
    VALUES (?, ?, ?, COALESCE(?, 'todo'), COALESCE(?, 3), ?, ?)
  `).run(id, title, description || null, status || null, priority || null, req.user.id, due_date || null);
  res.json({ ok: true, task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) });
});

router.put('/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const { title, description, status, priority, due_date } = req.body || {};
  const t = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!t) return res.status(404).json({ ok: false, error: 'not_found' });
  db.prepare(`
    UPDATE tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(title || null, description || null, status || null, priority || null, due_date || null, id);
  res.json({ ok: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
