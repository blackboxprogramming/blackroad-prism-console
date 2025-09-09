PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS jobs (
  job_id      TEXT PRIMARY KEY,
  project_id  TEXT,
  kind        TEXT,
  cmd         TEXT,
  args_json   TEXT,
  env_json    TEXT,
  status      TEXT,         -- queued|running|ok|error|canceled
  progress    REAL,         -- 0..1
  exit_code   INTEGER,
  started_at  INTEGER,
  finished_at INTEGER,
  meta_json   TEXT
);

CREATE TABLE IF NOT EXISTS job_events (
  job_id  TEXT NOT NULL,
  seq     INTEGER NOT NULL,
  ts      INTEGER NOT NULL,
  type    TEXT,             -- log|progress|state
  data    TEXT,             -- raw line or json
  PRIMARY KEY (job_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_jobs_project ON jobs (project_id, started_at DESC);
