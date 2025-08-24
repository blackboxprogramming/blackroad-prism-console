'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.use(requireAuth);

// List tasks for current user
router.get('/', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ ok: true, tasks });
});

// Create task under project
router.post('/', (req, res) => {
  const { project_id, title, status } = req.body || {};
  if (!project_id || !title || !title.trim()) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const id = cryptoRandomId();
  db.prepare(
    'INSERT INTO tasks (id, project_id, user_id, title, status) VALUES (?, ?, ?, ?, COALESCE(?, "pending"))',
  ).run(id, project_id, req.user.id, title.trim(), status || null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ok: true, task });
});

// Update task
router.put('/:id', (req, res) => {
  const { title, status } = req.body || {};
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  db.prepare(
    'UPDATE tasks SET title = COALESCE(?, title), status = COALESCE(?, status) WHERE id = ?',
  ).run(title ? title.trim() : null, status || null, req.params.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ ok: true, task: updated });
});

// Delete task
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;

