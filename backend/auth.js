'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { store } = require('./data');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function sanitizeUser(u) {
  const { id, username, role, created_at, projectId } = u;
  return { id, username, role, created_at, projectId };
}

function signToken(user, expires = '1h') {
  return jwt.sign({ id: user.id, role: user.role, projectId: user.projectId }, JWT_SECRET, { expiresIn: expires });
}

function signup(req, res) {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'missing_fields' });
  if (store.users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'user_exists' });
  }
  const user = {
    id: uuidv4(),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role === 'admin' ? 'admin' : 'user',
    created_at: new Date().toISOString(),
    projectId: store.projects[0]?.id || null
  };
  store.users.push(user);
  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
}

function login(req, res) {
  const { username, password } = req.body || {};
  const user = store.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const token = signToken(user);
  const refreshToken = uuidv4();
  store.sessions.push({ token: refreshToken, userId: user.id });
  res.json({ token, refreshToken, user: sanitizeUser(user) });
}

function logout(req, res) {
  const { refreshToken } = req.body || {};
  const idx = store.sessions.findIndex(s => s.token === refreshToken);
  if (idx >= 0) store.sessions.splice(idx, 1);
  res.json({ ok: true });
}

function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

module.exports = {
  signup,
  login,
  logout,
  authMiddleware,
  requireRole,
  JWT_SECRET,
  signToken
};
