// FILE: /srv/blackroad-api/src/auth.js
'use strict';

const bcrypt = require('bcryptjs');
const db = require('./db');

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: 'auth_required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: 'auth_required' });
  }
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'admin_required' });
  }
  next();
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ ok: false, error: 'auth_required' });
    }
    const user = db
      .prepare('SELECT id, role FROM users WHERE id = ?')
      .get(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    next();
  };
}

function getUserById(id) {
  return db.prepare('SELECT id, email, name, role, created_at, updated_at, last_login_at, is_active FROM users WHERE id = ?').get(id);
}

module.exports = {
  hashPassword,
  verifyPassword,
  requireAuth,
  requireAdmin,
  requireRole,
  getUserById
};
