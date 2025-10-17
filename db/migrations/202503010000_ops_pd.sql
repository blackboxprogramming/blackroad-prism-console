CREATE TABLE IF NOT EXISTS ops_incident_audit (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create','resolve','bulk')),
  system_key TEXT,
  pd_incident_id TEXT,
  url TEXT,
  payload_hash TEXT,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_incident_system_created_at
  ON ops_incident_audit(system_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_incident_pd_created_at
  ON ops_incident_audit(pd_incident_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_incident_action_created_at
  ON ops_incident_audit(action, created_at DESC);
