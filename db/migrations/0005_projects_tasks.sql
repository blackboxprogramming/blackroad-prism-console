-- FILE: /srv/blackroad-api/db/migrations/0005_projects_tasks.sql
PRAGMA foreign_keys = ON;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

CREATE TRIGGER IF NOT EXISTS projects_updated BEFORE UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Replace tasks table with project tasks
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS tasks_updated BEFORE UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;
