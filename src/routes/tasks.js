'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// all task routes require authentication
router.use(requireAuth);

const ALLOWED_STATUS = new Set(['pending', 'in_progress', 'review', 'done', 'todo']);

// Shared helper to validate/normalize the incoming payload and persist the task
function createTaskForProject(project, ownerId, payload) {
  const { title, status } = payload || {};
  if (!title || !title.trim()) {
    return { status: 400, body: { ok: false, error: 'missing_title' } };
  }
  const trimmed = title.trim();
  if (trimmed.length > 255) {
    return { status: 400, body: { ok: false, error: 'invalid_title' } };
  }

  let normalizedStatus = null;
  if (status !== undefined && status !== null) {
    const candidate = String(status).trim().toLowerCase();
    if (!ALLOWED_STATUS.has(candidate)) {
      return { status: 400, body: { ok: false, error: 'invalid_status' } };
    }
    normalizedStatus = candidate;
  }

  const id = cryptoRandomId();
  db.prepare(
    'INSERT INTO tasks (id, project_id, user_id, title, status) VALUES (?, ?, ?, ?, COALESCE(?, "pending"))',
  ).run(id, project.id, ownerId, trimmed, normalizedStatus);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return { status: 200, body: { ok: true, task } };
}

function ensurePersonalProject(user) {
  const existing = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at ASC LIMIT 1')
    .get(user.id);
  if (existing) return existing;

  const id = cryptoRandomId();
  db.prepare('INSERT INTO projects (id, user_id, name, metadata) VALUES (?, ?, ?, ?)')
    .run(id, user.id, 'Personal', JSON.stringify({ system: true }));
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

// Create task within a project (legacy route used by some clients)
router.post('/projects/:projectId/tasks', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const result = createTaskForProject(project, project.user_id, req.body);
  return res.status(result.status).json(result.body);
});

// Create task and automatically scope it to the provided or personal project
router.post('/tasks', (req, res) => {
  const { projectId } = req.body || {};
  let project;

  if (projectId) {
    project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
    if (project.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
  } else {
    project = ensurePersonalProject(req.user);
  }

  const result = createTaskForProject(project, req.user.id, req.body);
  return res.status(result.status).json(result.body);
});

// List tasks for current user (or specific project when provided)
router.get('/tasks', (req, res) => {
  const { projectId } = req.query || {};

  if (projectId) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
    if (project.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    const tasks = db
      .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC')
      .all(project.id);
    return res.json({ ok: true, tasks });
  }

  if (req.user.role === 'admin') {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    return res.json({ ok: true, tasks });
  }

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  return res.json({ ok: true, tasks });
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
  let normalizedStatus = null;
  if (status !== undefined && status !== null) {
    const candidate = String(status).trim().toLowerCase();
    if (!ALLOWED_STATUS.has(candidate)) {
      return res.status(400).json({ ok: false, error: 'invalid_status' });
    }
    normalizedStatus = candidate;
  }
  db.prepare(
    'UPDATE tasks SET title = COALESCE(?, title), status = COALESCE(?, status) WHERE id = ?',
  ).run(trimmed || null, normalizedStatus || null, req.params.id);
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

