-- FILE: /srv/blackroad-api/db/migrations/0002_logs_monitoring.sql
ALTER TABLE contradictions RENAME COLUMN source TO module;
ALTER TABLE contradictions RENAME COLUMN created_at TO timestamp;

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
