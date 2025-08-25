<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/retrieval.ts -->
const db = require('../../src/db');
const { FLAG_ALLOW_FTS_FALLBACK } = require('./config');
const { logContradiction } = require('./contradictions');

function indexMessage(message_id, session_id, content) {
  try {
    db.prepare('INSERT INTO lbrain_fts(content, message_id, session_id) VALUES (?,?,?)')
      .run(content, message_id, session_id);
  } catch (e) {
    logContradiction(session_id, 'Ψ′₃₂', 'warn', 'FTS index failed');
  }
}

function search(session_id, query, k = 5) {
  try {
    return db.prepare('SELECT message_id, content FROM lbrain_fts WHERE session_id = ? AND lbrain_fts MATCH ? LIMIT ?')
      .all(session_id, query, k);
  } catch (e) {
    logContradiction(session_id, 'Ψ′₃₂', 'warn', 'FTS search missing');
    if (!FLAG_ALLOW_FTS_FALLBACK) throw e;
    return [];
  }
}

module.exports = { indexMessage, search };
