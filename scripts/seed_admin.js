// FILE: /srv/blackroad-api/scripts/seed_admin.js
'use strict';

require('dotenv').config();
const db = require('../src/db');
const { hashPassword } = require('../src/auth');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = require('../src/config');

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

function main() {
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
  if (row) {
    console.log('[seed] admin already exists:', ADMIN_EMAIL);
    return;
  }
  const id = cryptoRandomId();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(id, ADMIN_EMAIL, hashPassword(ADMIN_PASSWORD), ADMIN_NAME);

  const walletId = cryptoRandomId();
  db.prepare(`INSERT INTO wallets (id, owner_type, owner_id, balance) VALUES (?, 'user', ?, 0)`)
    .run(walletId, id);

  console.log('[seed] created admin:', ADMIN_EMAIL);
}

main();
