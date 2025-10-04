-- Linear connector landing tables
CREATE TABLE IF NOT EXISTS prism_sources (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prism_sources_status ON prism_sources(status);

CREATE TABLE IF NOT EXISTS raw_linear_issues (
  id            TEXT PRIMARY KEY,
  number        INT NOT NULL,
  team_key      TEXT NOT NULL,
  team_name     TEXT,
  project_name  TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  state         TEXT NOT NULL,
  priority      INT,
  estimate      NUMERIC,
  labels        JSONB NOT NULL DEFAULT '[]',
  assignee      TEXT,
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL,
  completed_at  TIMESTAMPTZ,
  payload       JSONB NOT NULL,
  source_id     UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rli_state     ON raw_linear_issues(state);
CREATE INDEX IF NOT EXISTS idx_rli_team      ON raw_linear_issues(team_key);
CREATE INDEX IF NOT EXISTS idx_rli_completed ON raw_linear_issues(completed_at);

CREATE TABLE IF NOT EXISTS linear_team_sync (
  source_id UUID NOT NULL,
  team_key  TEXT NOT NULL,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01',
  PRIMARY KEY (source_id, team_key)
);
