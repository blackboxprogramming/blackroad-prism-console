<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/contradictions.ts -->
const db = require('../../src/db');
const { log } = require('./logger');

function logContradiction(session_id, operator, severity, note) {
  try {
    db.prepare(`INSERT INTO lbrain_contradictions (session_id, operator, severity, note) VALUES (?,?,?,?)`)
      .run(session_id, operator, severity, note);
    log('contradiction', { session_id, operator, severity, note });
  } catch (e) {
    console.error('[lbrain:contradictions]', e);
  }
}

function listContradictions(session_id) {
  return db.prepare(`SELECT id, operator, severity, note, created_at FROM lbrain_contradictions WHERE session_id = ? ORDER BY id ASC`).all(session_id);
}

function countContradictions(session_id) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM lbrain_contradictions WHERE session_id = ?`).get(session_id);
  return row ? row.c : 0;
}

module.exports = { logContradiction, listContradictions, countContradictions };
