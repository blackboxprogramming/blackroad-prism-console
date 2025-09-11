'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { JWT_SECRET } = require('./config');

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function requireAuth(req, res, next) {
  let userId = req.session && req.session.userId;

  if (!userId) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }
  }

  if (!userId) {
    return res.status(401).json({ ok: false, error: 'auth_required' });
  }

  const user = db
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .get(userId);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'auth_required' });
  }

  req.session = req.session || {};
  req.session.userId = user.id;
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'admin_required' });
    }
    next();
  });
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
