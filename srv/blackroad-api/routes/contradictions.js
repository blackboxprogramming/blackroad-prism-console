const express = require('express');
const { db } = require('../lib/db');

const router = express.Router();

router.post('/api/contradictions/:id/resolve', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ ok: false, error: 'invalid_id' });
  }

  const note = req.body?.note ? String(req.body.note) : '';
  const ref = req.body?.ref ? String(req.body.ref) : null;
  const timestamp = new Date().toISOString();
  const existing = db
    .prepare('SELECT resolver_note, resolver_ref FROM error_contradictions WHERE id = ?')
    .get(id);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  const entries = [];
  if (existing.resolver_note) entries.push(existing.resolver_note);
  if (note || entries.length === 0) {
    entries.push(`${timestamp} ${note}`.trim());
  }
  const nextNote = entries.join('\n');

  const resolverRef = ref ?? existing.resolver_ref ?? null;

  db.prepare(
    `UPDATE error_contradictions
     SET resolved = 1,
         resolved_ts = datetime('now'),
         resolver_note = ?,
         resolver_ref = ?
     WHERE id = ?`
  ).run(nextNote, resolverRef, id);

  res.json({ ok: true, id });
});

router.get('/api/contradictions/unresolved', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, ts, route, method, state, severity, code, message
       FROM error_contradictions
       WHERE resolved = 0
       ORDER BY datetime(ts) DESC
       LIMIT 200`
    )
    .all();

  res.json({ ok: true, items: rows });
});

module.exports = router;
