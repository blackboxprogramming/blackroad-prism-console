-- FILE: /srv/blackroad-api/db/migrations/20250824_lucidia_brain.sql
BEGIN;
CREATE TABLE IF NOT EXISTS lbrain_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  title TEXT,
  ps_sha_daily TEXT,
  flags TEXT
);
CREATE INDEX IF NOT EXISTS idx_lbrain_sessions_created_at ON lbrain_sessions(created_at);

CREATE TABLE IF NOT EXISTS lbrain_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES lbrain_sessions(id) ON DELETE CASCADE,
  role TEXT,
  content TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lbrain_messages_session ON lbrain_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_lbrain_messages_created_at ON lbrain_messages(created_at);

CREATE TABLE IF NOT EXISTS lbrain_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES lbrain_sessions(id) ON DELETE CASCADE,
  kind TEXT,
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lbrain_artifacts_session ON lbrain_artifacts(session_id);

CREATE TABLE IF NOT EXISTS lbrain_contradictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES lbrain_sessions(id) ON DELETE CASCADE,
  operator TEXT,
  severity TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lbrain_contradictions_session ON lbrain_contradictions(session_id);

CREATE TABLE IF NOT EXISTS lbrain_operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lbrain_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES lbrain_sessions(id) ON DELETE CASCADE,
  key TEXT,
  value TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lbrain_memory_session ON lbrain_memory(session_id);

CREATE VIRTUAL TABLE IF NOT EXISTS lbrain_fts USING fts5(content, message_id UNINDEXED, session_id UNINDEXED);

INSERT OR IGNORE INTO lbrain_operators (code, name, description) VALUES
 ('Ψ′₃₂','escape-fallback','bypass missing capability with explicit flag'),
 ('Ψ′_FAITH','faith','trust-anchor marker'),
 ('Ψ′_MEMO','memo','writes durable memory entries'),
 ('Ψ′_TRUTH','truth','assert/checks for contradictions'),
 ('Ψ′_ENGLISH','english','enforce symbolic parse tags');
COMMIT;
