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

// ROADCOIN seed and backfill
(function seedRc() {
  const hasPrices = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rc_prices'")
    .get();
  if (hasPrices) {
    const defaults = {
      tts_per_10s: 1,
      image_gen: 2,
      render_draft_base: 10,
      render_draft_per_scene: 1,
      render_final_base: 30,
      render_final_per_scene: 3,
      llm_token_1k: 1,
      storage_per_mb: 0
    };
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO rc_prices (key, amount, active) VALUES (?, ?, 1)'
    );
    for (const [k, v] of Object.entries(defaults)) {
      const envKey = `RC_PRICE_${k.toUpperCase()}`;
      const val = Number.parseInt(process.env[envKey], 10);
      stmt.run(k, Number.isFinite(val) ? val : v);
    }
  }

  const hasCharges = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rc_charges'")
    .get();
  if (hasCharges) {
    const rows = db.prepare('SELECT user_id, amount, job_id, reason FROM rc_charges').all();
    const insert = db.prepare(
      `INSERT OR IGNORE INTO rc_ledger (id, user_id, delta, source, module, ref_type, ref_id, memo, created_at, created_by)
       VALUES (?, ?, ?, 'job', 'roadview', 'job', ?, ?, ?, ?)`
    );
    const now = Math.floor(Date.now() / 1000);
    for (const r of rows) {
      insert.run(cryptoRandomId(), r.user_id, -r.amount, r.job_id, r.reason, now, 'system');
    }
  }
})();

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
