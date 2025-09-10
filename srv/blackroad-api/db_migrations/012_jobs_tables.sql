CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  project_id TEXT,
  kind TEXT,
  cmd TEXT,
  args_json TEXT,
  env_json TEXT,
  status TEXT,
  progress REAL DEFAULT 0,
  exit_code INTEGER,
  started_at INTEGER,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS job_events (
  job_id TEXT,
  seq INTEGER,
  ts INTEGER,
  type TEXT,
  data TEXT,
  PRIMARY KEY(job_id, seq)
);
