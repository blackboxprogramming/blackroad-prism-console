CREATE TABLE IF NOT EXISTS exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exception_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exception_id INTEGER NOT NULL,
  at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  note TEXT NULL
);

CREATE INDEX IF NOT EXISTS ix_exc_rule ON exceptions(rule_id, status);
CREATE INDEX IF NOT EXISTS ix_exc_subject ON exceptions(subject_type, subject_id, status);
