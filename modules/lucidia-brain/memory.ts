<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/memory.ts -->
const db = require('../../src/db');
const { computeDailyCode } = require('./pssha');
const { indexMessage } = require('./retrieval');

function createSession(title = '', flags = {}) {
  const date = new Date().toISOString().slice(0,10);
  const code = computeDailyCode(date);
  const res = db.prepare('INSERT INTO lbrain_sessions (title, ps_sha_daily, flags) VALUES (?,?,?)')
    .run(title, code, JSON.stringify(flags||{}));
  return { session_id: res.lastInsertRowid, ps_sha_daily: code, created_at: date };
}

function addMessage(session_id, role, content, tokens_in = 0, tokens_out = 0) {
  const res = db.prepare('INSERT INTO lbrain_messages (session_id, role, content, tokens_in, tokens_out) VALUES (?,?,?,?,?)')
    .run(session_id, role, content, tokens_in, tokens_out);
  indexMessage(res.lastInsertRowid, session_id, content);
  return { message_id: res.lastInsertRowid };
}

function storeMemory(session_id, key, value) {
  const res = db.prepare('INSERT INTO lbrain_memory (session_id, key, value) VALUES (?,?,?)')
    .run(session_id, key, value);
  return { memory_id: res.lastInsertRowid };
}

function exportSession(id) {
  const session = db.prepare('SELECT * FROM lbrain_sessions WHERE id=?').get(id);
  const messages = db.prepare('SELECT * FROM lbrain_messages WHERE session_id=? ORDER BY id').all(id);
  const artifacts = db.prepare('SELECT * FROM lbrain_artifacts WHERE session_id=? ORDER BY id').all(id);
  const contradictions = db.prepare('SELECT * FROM lbrain_contradictions WHERE session_id=? ORDER BY id').all(id);
  const memory = db.prepare('SELECT * FROM lbrain_memory WHERE session_id=? ORDER BY id').all(id);
  return { session, messages, artifacts, contradictions, memory };
}

module.exports = { createSession, addMessage, storeMemory, exportSession };
