-- FILE: /srv/blackroad-api/db_migrations/009_devices.sql
-- Devices backplane tables
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS devices_last_seen (
  device_id   TEXT PRIMARY KEY,
  role        TEXT,
  ts_unix     INTEGER,
  payload     TEXT
);

CREATE TABLE IF NOT EXISTS devices_commands (
  cmd_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   TEXT NOT NULL,
  payload     TEXT NOT NULL,     -- JSON
  created_at  INTEGER NOT NULL,  -- unix seconds
  ttl_s       INTEGER NOT NULL DEFAULT 120
);

CREATE INDEX IF NOT EXISTS idx_commands_device_time
  ON devices_commands (device_id, created_at DESC);
