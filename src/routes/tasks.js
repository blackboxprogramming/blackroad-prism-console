// FILE: /srv/blackroad-api/src/routes/tasks.js
'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// Create task under project
router.post('/projects/:id/tasks', requireAuth, (req, res) => {
  const projectId = req.params.id;
  const { title, status } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ ok: false, error: 'missing_title' });
  }
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ?')
    .get(projectId);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const id = cryptoRandomId();
  db.prepare(
    'INSERT INTO tasks (id, project_id, user_id, title, status) VALUES (?, ?, ?, ?, COALESCE(?, "pending"))',
  ).run(id, projectId, req.user.id, title.trim(), status || null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ok: true, task });
});

// List tasks for a project
router.get('/projects/:id/tasks', requireAuth, (req, res) => {
  const projectId = req.params.id;
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ?')
    .get(projectId);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId);
  res.json({ ok: true, tasks });
});

// Update task
router.put('/tasks/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { title, status } = req.body || {};
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ ok: false, error: 'missing_title' });
  }
  db.prepare(
    'UPDATE tasks SET title = COALESCE(?, title), status = COALESCE(?, status) WHERE id = ?',
  ).run(title && title.trim() ? title.trim() : null, status || null, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ok: true, task: updated });
});

// Delete task
router.delete('/tasks/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
