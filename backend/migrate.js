'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_FILE =
  process.env.NODE_ENV === 'test'
    ? '/tmp/blackroad_test.db'
    : '/srv/blackroad-api/blackroad.db';

function migrate() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new Database(DB_FILE);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id TEXT NOT NULL,
      org_id INTEGER NOT NULL,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      requested_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      valid_from TEXT NULL,
      valid_until TEXT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS exception_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL REFERENCES exceptions(id) ON DELETE CASCADE,
      at TEXT NOT NULL DEFAULT (datetime('now')),
      actor INTEGER NOT NULL,
      action TEXT NOT NULL,
      note TEXT NULL
    );
    CREATE INDEX IF NOT EXISTS ix_exc_rule ON exceptions(rule_id, status);
    CREATE INDEX IF NOT EXISTS ix_exc_subject ON exceptions(subject_type, subject_id, status);
  `);
  db.close();
}

if (require.main === module) {
  migrate();
  console.log('Database migrated');
}

module.exports = migrate;
module.exports.DB_FILE = DB_FILE;
