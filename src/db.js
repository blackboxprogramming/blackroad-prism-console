// FILE: /srv/blackroad-api/src/db.js
'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const { DB_PATH, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = require('./config');

// Ensure directory exists
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch {}

const db = new Database(DB_PATH);

// Pragmas for safety/performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Apply migrations from /db/migrations
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
try {
  fs.mkdirSync(migrationsDir, { recursive: true });
} catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const applied = new Set(db.prepare('SELECT filename FROM schema_migrations').all().map(r => r.filename));

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
for (const file of files) {
  if (!applied.has(file)) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf-8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
      db.exec('COMMIT');
      console.log(`[db] applied migration ${file}`);
    } catch (e) {
      db.exec('ROLLBACK');
      console.error(`[db] migration ${file} failed:`, e);
      throw e;
    }
  }
}

// Ensure admin user
(function ensureAdmin() {
  const getUser = db.prepare('SELECT id FROM users WHERE email = ?');
  const row = getUser.get(ADMIN_EMAIL);
  if (!row) {
    const id = cryptoRandomId();
    const passwordHash = hashPassword(ADMIN_PASSWORD);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, 'admin')
    `).run(id, ADMIN_EMAIL, passwordHash, ADMIN_NAME);
    // Ensure wallet exists for this admin
    const walletId = cryptoRandomId();
    db.prepare(`
      INSERT INTO wallets (id, owner_type, owner_id, balance)
      VALUES (?, 'user', ?, 0)
    `).run(walletId, id);
    console.log('[db] created bootstrap admin:', ADMIN_EMAIL);
  }
})();

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function cryptoRandomId() {
  // 32-char hex
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = db;
