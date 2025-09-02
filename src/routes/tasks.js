'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// all task routes require authentication
router.use(requireAuth);

// Create task within a project
router.post('/projects/:projectId/tasks', (req, res) => {
  const { title, status } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ ok: false, error: 'missing_title' });
  }
  const trimmed = title.trim();
  if (trimmed.length > 255) {
    return res.status(400).json({ ok: false, error: 'invalid_title' });
  }
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const id = cryptoRandomId();
  db.prepare(
    'INSERT INTO tasks (id, project_id, user_id, title, status) VALUES (?, ?, ?, ?, COALESCE(?, "pending"))',
  ).run(id, project.id, project.user_id, trimmed, status || null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ok: true, task });
});

// List tasks for a project
router.get('/projects/:projectId/tasks', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC')
    .all(project.id);
  res.json({ ok: true, tasks });
});

// Fetch single task
router.get('/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  res.json({ ok: true, task });
});

// Update a task
router.put('/tasks/:id', (req, res) => {
  const { title, status } = req.body || {};
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  let trimmed;
  if (title && title.trim()) {
    trimmed = title.trim();
    if (trimmed.length > 255) {
      return res.status(400).json({ ok: false, error: 'invalid_title' });
    }
  }
  db.prepare(
    'UPDATE tasks SET title = COALESCE(?, title), status = COALESCE(?, status) WHERE id = ?',
  ).run(trimmed || null, status || null, req.params.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ ok: true, task: updated });
});

// Delete a task
router.delete('/tasks/:id', (req, res) => {
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

