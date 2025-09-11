'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.post('/', requireAuth, (req, res) => {
  const { name, metadata } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'missing_name' });
  }
  const trimmed = name.trim();
  if (trimmed.length > 255) {
    return res.status(400).json({ ok: false, error: 'invalid_name' });
  }
  const exists = db
    .prepare('SELECT id FROM projects WHERE user_id = ? AND name = ?')
    .get(req.user.id, trimmed);
  if (exists) {
    return res.status(409).json({ ok: false, error: 'duplicate_project' });
  }
  const id = cryptoRandomId();
  db.prepare(
    'INSERT INTO projects (id, user_id, name, metadata) VALUES (?, ?, ?, ?)',
  ).run(id, req.user.id, trimmed, metadata ? JSON.stringify(metadata) : null);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ ok: true, project });
});

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ ok: true, projects: rows });
});

router.get('/:id', requireAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  res.json({ ok: true, project });
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, metadata } = req.body || {};
  const id = req.params.id;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  let trimmed;
  if (name && name.trim()) {
    trimmed = name.trim();
    if (trimmed.length > 255) {
      return res.status(400).json({ ok: false, error: 'invalid_name' });
    }
    const dup = db
      .prepare('SELECT id FROM projects WHERE user_id = ? AND name = ? AND id != ?')
      .get(project.user_id, trimmed, id);
    if (dup) return res.status(409).json({ ok: false, error: 'duplicate_project' });
  }
  db.prepare(
    'UPDATE projects SET name = COALESCE(?, name), metadata = COALESCE(?, metadata) WHERE id = ?',
  ).run(
    trimmed || null,
    metadata ? JSON.stringify(metadata) : null,
    id,
  );
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ ok: true, project: updated });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ ok: false, error: 'not_found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
