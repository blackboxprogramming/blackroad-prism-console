PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS truth_quorum (
  cid   TEXT NOT NULL,
  did   TEXT NOT NULL,  -- attesting device DID
  node  TEXT,           -- hostname or label
  ts    INTEGER NOT NULL,
  PRIMARY KEY (cid, did)
);

CREATE INDEX IF NOT EXISTS idx_quorum_cid ON truth_quorum (cid);
