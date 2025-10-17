-- FILE: /srv/blackroad-api/db/migrations/202601150000_claim_contradiction_log.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS source (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  uri TEXT
);

CREATE INDEX IF NOT EXISTS idx_source_kind_label ON source (kind, label);

CREATE TABLE IF NOT EXISTS claim (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  topic TEXT NOT NULL,
  statement TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_topic_statement ON claim (topic, statement);
CREATE INDEX IF NOT EXISTS idx_claim_topic ON claim (topic);

CREATE TABLE IF NOT EXISTS claim_observation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  polarity INTEGER NOT NULL CHECK (polarity IN (-1, 0, 1)),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  note TEXT,
  observed_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  FOREIGN KEY (claim_id) REFERENCES claim(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES source(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_obs_claim ON claim_observation (claim_id);
CREATE INDEX IF NOT EXISTS idx_obs_status ON claim_observation (status);
CREATE INDEX IF NOT EXISTS idx_obs_polarity ON claim_observation (polarity);
CREATE INDEX IF NOT EXISTS idx_obs_source ON claim_observation (source_id);

DROP VIEW IF EXISTS claim_score;
CREATE VIEW claim_score AS
SELECT
  c.id AS claim_id,
  c.topic,
  c.statement,
  COALESCE(SUM(CASE WHEN o.polarity = 1 THEN o.confidence ELSE 0 END), 0) AS support,
  COALESCE(SUM(CASE WHEN o.polarity = -1 THEN o.confidence ELSE 0 END), 0) AS refute,
  COALESCE(SUM(CASE WHEN o.polarity = 0 THEN o.confidence ELSE 0 END), 0) AS unknown,
  COALESCE(COUNT(o.id), 0) AS observation_count,
  COALESCE(SUM(CASE WHEN o.id IS NOT NULL AND COALESCE(o.status, 'open') <> 'resolved' THEN 1 ELSE 0 END), 0) AS open_observations,
  MAX(o.observed_at) AS last_observed_at
FROM claim c
LEFT JOIN claim_observation o ON o.claim_id = c.id
GROUP BY c.id, c.topic, c.statement;

DROP VIEW IF EXISTS claim_contradictions;
CREATE VIEW claim_contradictions AS
SELECT *
FROM claim_score
WHERE support > 0 AND refute > 0;
