'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');
const { getAgentsSummary } = require('../services/agentSummary');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM agents ORDER BY name').all();
  res.json({ ok: true, agents: rows });
});

// Aggregate health information for core services
router.get('/summary', requireAuth, async (_req, res) => {
  const summary = await getAgentsSummary();
  res.json(summary);
});

router.post('/', requireAdmin, (req, res) => {
const { slug, name, status, memory_path, notes, location } = req.body || {};
  const { slug, name, status, memory_path, notes, location } = req.body || {};
  if (!slug || !name) return res.status(400).json({ ok: false, error: 'missing_fields' });
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO agents (id, slug, name, status, memory_path, notes, location)
    VALUES (?, ?, ?, COALESCE(?, 'idle'), ?, ?, COALESCE(?, 'cloud'))
    VALUES (?, ?, ?, COALESCE(?, 'idle'), ?, ?, COALESCE(?, 'local'))
  `).run(id, slug, name, status || null, memory_path || null, notes || null, location || null);
  res.json({ ok: true, agent: db.prepare('SELECT * FROM agents WHERE id = ?').get(id) });
});

router.get('/:id', requireAuth, (req, res) => {
  const a = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, agent: a });
});

router.get('/:id/manifest', requireAuth, (req, res) => {
  const a = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'not_found' });
  const manifest = {
    id: a.id,
    slug: a.slug,
    name: a.name,
    location: a.location || 'cloud'
  };
  res.json({ ok: true, manifest });
});

router.post('/:id/ping', requireAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  const exists = db.prepare('SELECT id FROM agents WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ ok: false, error: 'not_found' });
  db.prepare('UPDATE agents SET status = COALESCE(?, status), heartbeat_at = datetime("now") WHERE id = ?')
    .run(status || null, id);
  res.json({ ok: true });
});

router.post('/:id/logs', requireAuth, (req, res) => {
  const id = req.params.id;
  const { level, message, meta } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: 'missing_message' });
  const logId = cryptoRandomId();
  db.prepare(`
    INSERT INTO agent_logs (id, agent_id, level, message, meta)
    VALUES (?, ?, COALESCE(?, 'info'), ?, ?)
  `).run(logId, id, level || null, message, meta ? JSON.stringify(meta) : null);
  res.json({ ok: true });
});

router.get('/:id/logs', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const rows = db
    .prepare('SELECT * FROM agent_logs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(req.params.id, limit);
  res.json({ ok: true, logs: rows });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
