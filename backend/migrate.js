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
      ticket_system TEXT NULL,
      ticket_key TEXT NULL,
      ticket_url TEXT NULL,
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
    CREATE INDEX IF NOT EXISTS ix_exc_ticket ON exceptions(ticket_system, ticket_key);
    CREATE TABLE IF NOT EXISTS ticket_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL UNIQUE REFERENCES exceptions(id) ON DELETE CASCADE,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT NULL,
      next_try TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS ix_ticket_queue_next ON ticket_queue(next_try);
  `);

  ensureColumn(db, 'exceptions', 'ticket_system', "ticket_system TEXT NULL");
  ensureColumn(db, 'exceptions', 'ticket_key', "ticket_key TEXT NULL");
  ensureColumn(db, 'exceptions', 'ticket_url', "ticket_url TEXT NULL");
  ensureTable(db, 'ticket_queue', () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ticket_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exception_id INTEGER NOT NULL UNIQUE REFERENCES exceptions(id) ON DELETE CASCADE,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        next_try TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec('CREATE INDEX IF NOT EXISTS ix_ticket_queue_next ON ticket_queue(next_try)');
  });
  db.close();
}

function ensureColumn(db, table, column, ddl) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((col) => col.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

function ensureTable(db, table, createFn) {
  const exists = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`,
  ).get(table);
  if (!exists) {
    createFn();
  }
}

if (require.main === module) {
  migrate();
  console.log('Database migrated');
}

module.exports = migrate;
module.exports.DB_FILE = DB_FILE;
