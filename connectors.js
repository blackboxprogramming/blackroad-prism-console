'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();
const LOG_FILE = '/var/log/blackroad-connectors.log';
const ALLOWED_ROOTS = ['/srv', '/var/www/blackroad'];

function log(action, target) {
  const line = `${new Date().toISOString()} ${action} ${target}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
}

function resolveSafe(p) {
  const resolved = path.resolve(p);
  if (
    !ALLOWED_ROOTS.some((root) =>
      resolved === root || resolved.startsWith(root + path.sep)
    )
  ) {
    throw new Error('path_not_allowed');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const express = require('express');

const router = express.Router();
const ROOTS = ['/srv', '/var/www/blackroad'];
const CONNECTOR_KEY = process.env.CONNECTOR_KEY || '';
const LOG_FILE = '/var/log/blackroad-connectors.log';

function log(action, details) {
  const entry = `${new Date().toISOString()} ${action} ${JSON.stringify(details)}\n`;
  try {
    fs.appendFileSync(LOG_FILE, entry);
  } catch (err) {
    console.error('log write failed', err);
  }
}

router.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${CONNECTOR_KEY}`) {
    log('unauthorized', { path: req.path, ip: req.ip });
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
});

function validatePath(p) {
  const resolved = path.resolve(p);
  if (!ROOTS.some((root) => resolved.startsWith(root))) {
    throw new Error('Path outside allowed directories');
  }
  return resolved;
}

function requireAuth(req, res, next) {
  const auth = req.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token && token === process.env.CONNECTOR_KEY) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

router.use(requireAuth);

router.post('/paste', (req, res) => {
  const { path: filePath, content } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'path_required' });
  try {
    const target = resolveSafe(filePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content || '');
    log('paste', target);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
function verifyPublicFile(resolved) {
  if (resolved.startsWith('/var/www/blackroad/')) {
    const rel = resolved.replace('/var/www/blackroad', '');
    exec(`curl -s https://blackroad.io${rel}`, () => {});
  }
}

router.post('/paste', (req, res) => {
  try {
    const { path: filePath, content } = req.body || {};
    const resolved = validatePath(filePath);
    fs.writeFileSync(resolved, content, 'utf8');
    const verify = fs.readFileSync(resolved, 'utf8');
    verifyPublicFile(resolved);
    log('paste', { path: resolved });
    res.json({ ok: true, path: resolved, verified: verify === content });
  } catch (e) {
    log('error', { action: 'paste', message: e.message });
    res.status(500).json({ error: e.message });
  }
});

router.post('/append', (req, res) => {
  const { path: filePath, content } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'path_required' });
  try {
    const target = resolveSafe(filePath);
    fs.appendFileSync(target, content || '');
    log('append', target);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  try {
    const { path: filePath, content } = req.body || {};
    const resolved = validatePath(filePath);
    fs.appendFileSync(resolved, content, 'utf8');
    const verify = fs.readFileSync(resolved, 'utf8');
    verifyPublicFile(resolved);
    log('append', { path: resolved });
    res.json({ ok: true, path: resolved, length: verify.length });
  } catch (e) {
    log('error', { action: 'append', message: e.message });
    res.status(500).json({ error: e.message });
  }
});

router.post('/replace', (req, res) => {
  const { path: filePath, find, replace } = req.body || {};
  if (!filePath || find === undefined || replace === undefined)
    return res.status(400).json({ error: 'invalid_body' });
  try {
    const target = resolveSafe(filePath);
    const data = fs.readFileSync(target, 'utf8');
    const result = data.replace(find, replace);
    fs.writeFileSync(target, result);
    log('replace', target);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  try {
    const { path: filePath, pattern, replacement } = req.body || {};
    const resolved = validatePath(filePath);
    let text = fs.readFileSync(resolved, 'utf8');
    const regex = new RegExp(pattern, 'g');
    text = text.replace(regex, replacement);
    fs.writeFileSync(resolved, text, 'utf8');
    verifyPublicFile(resolved);
    log('replace', { path: resolved, pattern });
    res.json({ ok: true, path: resolved });
  } catch (e) {
    log('error', { action: 'replace', message: e.message });
    res.status(500).json({ error: e.message });
  }
});

router.post('/restart', (req, res) => {
  const { service } = req.body || {};
  if (!service) return res.status(400).json({ error: 'service_required' });
  exec(`systemctl restart ${service}`, (err, stdout, stderr) => {
    log('restart', service);
    if (err) return res.status(500).json({ error: err.message, stderr });
    res.json({ ok: true, stdout });
  exec(`systemctl restart ${service}`, (err) => {
    if (err) {
      log('error', { action: 'restart', message: err.message });
      return res.status(500).json({ error: err.message });
    }
    log('restart', { service });
    res.json({ ok: true, service });
  });
});

router.post('/build', (req, res) => {
  const { dir } = req.body || {};
  if (!dir) return res.status(400).json({ error: 'dir_required' });
  try {
    const target = resolveSafe(dir);
    exec(`npm --prefix ${target} run build`, (err, stdout, stderr) => {
      log('build', target);
      if (err) return res.status(500).json({ error: err.message, stderr });
      res.json({ ok: true, stdout });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
  const { target } = req.body || {};
  let cmd = '';
  if (target === 'frontend') cmd = 'cd /srv/blackroad-frontend && npm run build';
  else if (target === 'api') cmd = 'cd /srv/blackroad-api && npm install';
  else if (target === 'llm') cmd = 'cd /srv/lucidia-llm && pip install -r requirements.txt';
  else if (target === 'math') cmd = 'cd /srv/lucidia-math && pip install -r requirements.txt';
  else return res.status(400).json({ error: 'Unknown target' });

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      log('error', { action: 'build', message: err.message });
      return res.status(500).json({ error: err.message });
    }
    log('build', { target });
    res.json({ ok: true, target, stdout, stderr });
  });
});

module.exports = router;
