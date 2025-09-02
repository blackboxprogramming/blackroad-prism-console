-- FILE: db/migrations/0003_roadview.sql
-- RoadView tables and view

CREATE TABLE IF NOT EXISTS roadview_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  visibility TEXT CHECK(visibility IN ('private','unlisted','public')) DEFAULT 'private',
  created_at INTEGER,
  updated_at INTEGER,
  archived INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS roadview_projects_user_idx ON roadview_projects(user_id);
CREATE INDEX IF NOT EXISTS roadview_projects_visibility_idx ON roadview_projects(visibility);

CREATE TABLE IF NOT EXISTS roadview_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('script','image','audio','video','json','style')),
  name TEXT,
  mime TEXT,
  size INTEGER,
  path TEXT,
  url TEXT,
  meta_json TEXT,
  created_at INTEGER,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS roadview_assets_project_idx ON roadview_assets(project_id);
CREATE INDEX IF NOT EXISTS roadview_assets_type_idx ON roadview_assets(type);

CREATE TABLE IF NOT EXISTS roadview_scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT,
  order_index INTEGER,
  duration_ms INTEGER DEFAULT 4000,
  content_json TEXT,
  audio_asset_id TEXT,
  voice_params_json TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS roadview_scenes_project_idx ON roadview_scenes(project_id);
CREATE INDEX IF NOT EXISTS roadview_scenes_order_idx ON roadview_scenes(order_index);

CREATE TABLE IF NOT EXISTS roadview_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('render','tts','image_gen')),
  status TEXT CHECK(status IN ('queued','running','completed','failed','canceled')) DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  rc_cost INTEGER DEFAULT 0,
  provider TEXT,
  provider_ref TEXT,
  input_json TEXT,
  output_json TEXT,
  log_text TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS roadview_jobs_project_idx ON roadview_jobs(project_id);
CREATE INDEX IF NOT EXISTS roadview_jobs_type_idx ON roadview_jobs(type);
CREATE INDEX IF NOT EXISTS roadview_jobs_status_idx ON roadview_jobs(status);
CREATE INDEX IF NOT EXISTS roadview_jobs_created_idx ON roadview_jobs(created_at);

CREATE VIEW IF NOT EXISTS roadview_project_summary_v AS
SELECT
  p.id,
  p.user_id,
  p.title,
  p.description,
  p.visibility,
  p.created_at,
  p.updated_at,
  p.archived,
  (SELECT COUNT(*) FROM roadview_scenes s WHERE s.project_id = p.id) AS scene_count,
  (SELECT COUNT(*) FROM roadview_assets a WHERE a.project_id = p.id) AS asset_count
FROM roadview_projects p;
