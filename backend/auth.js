'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb, addUser } = require('./data');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signup(req, res) {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
  const db = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'user_exists' });
  const passwordHash = bcrypt.hashSync(password, 10);
  const id = addUser(email, passwordHash);
  const token = jwt.sign({ id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id, email, role: 'user' } });
}

function login(req, res) {
  const { email, password } = req.body || {};
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const role = user.role || 'user';
  const token = jwt.sign({ id: user.id, role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, email: user.email, role } });
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No user' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function logout(_req, res) {
  res.json({ ok: true });
}

module.exports = {
  signup,
  login,
  logout,
  requireAuth,
  authMiddleware: requireAuth,
  requireRole,
  JWT_SECRET,
};

