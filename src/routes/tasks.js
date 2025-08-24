'use strict';

const express = require('express');
const { requireAuth } = require('../auth');
const data = require('../../backend/data');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const tasks = data.getAllTasks();
  res.json({ ok: true, tasks });
});

router.post('/', requireAuth, (req, res) => {
  const { project_id, title, status } = req.body || {};
  if (!project_id || !title) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const task = data.addTask(project_id, title, status);
  res.json({ ok: true, task });
});

router.put('/:id', requireAuth, (req, res) => {
  const { title, status } = req.body || {};
  const task = data.updateTask(req.params.id, { title, status });
  if (!task) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, task });
});

router.delete('/:id', requireAuth, (req, res) => {
  data.deleteTask(req.params.id);
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

module.exports = router;
