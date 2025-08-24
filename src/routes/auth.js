// FILE: /srv/blackroad-api/src/routes/auth.js
'use strict';

const express = require('express');
const { hashPassword, verifyPassword, requireAuth } = require('../auth');
const db = require('../db');
const { NODE_ENV } = require('../config');

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'missing_fields' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ ok: false, error: 'email_exists' });

  const id = cryptoRandomId();
  const passwordHash = hashPassword(password);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES (?, ?, ?, ?, 'user')
  `).run(id, email, passwordHash, name || null);

  // Create wallet
  const walletId = cryptoRandomId();
  db.prepare(`INSERT INTO wallets (id, owner_type, owner_id, balance) VALUES (?, 'user', ?, 0)`)
    .run(walletId, id);

  req.session.userId = id;
  return res.json({ ok: true, user: sanitizeUser(db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(id)) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'missing_fields' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  if (!verifyPassword(password, user.password_hash)) return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  if (user.is_active === 0) return res.status(403).json({ ok: false, error: 'inactive_user' });

  db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').run(user.id);
  req.session.userId = user.id;
  return res.json({ ok: true, user: sanitizeUser(user) });
});

router.post('/logout', requireAuth, (req, res) => {
  req.session = null;
  res.clearCookie('brsid', {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production'
  });
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ ok: true, user: null });
  const user = db.prepare('SELECT id, email, name, role, created_at, updated_at, last_login_at FROM users WHERE id = ?').get(req.session.userId);
  return res.json({ ok: true, user: user || null });
});

function sanitizeUser(u) {
  if (!u) return null;
  const { id, email, name, role, created_at, updated_at, last_login_at } = u;
  return { id, email, name, role, created_at, updated_at, last_login_at };
}

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
