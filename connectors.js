'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();
const LOG_FILE = '/var/log/blackroad-connectors.log';
const ROOTS = ['/srv', '/var/www/blackroad'];
const CONNECTOR_KEY = process.env.CONNECTOR_KEY;

function log(action, details) {
  const line = `${new Date().toISOString()} ${action} ${JSON.stringify(details)}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (_) {
    // ignore logging errors
  }
}

function validatePath(p) {
  const resolved = path.resolve(p || '');
  if (!ROOTS.some((root) => resolved === root || resolved.startsWith(root + path.sep))) {
    throw new Error('path_not_allowed');
  }
  return resolved;
}

function verifyPublicFile(resolved) {
  if (resolved.startsWith('/var/www/blackroad/')) {
    const rel = resolved.replace('/var/www/blackroad', '');
    exec(`curl -s https://blackroad.io${rel}`, () => {});
  }
}

router.use((req, res, next) => {
  const auth = req.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!CONNECTOR_KEY || !token || token !== CONNECTOR_KEY) {
    log('unauthorized', { path: req.path, ip: req.ip });
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
});

router.post('/paste', (req, res) => {
  try {
    const { path: filePath, content = '' } = req.body || {};
    const resolved = validatePath(filePath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, 'utf8');
    verifyPublicFile(resolved);
    log('paste', { path: resolved });
    res.json({ ok: true, path: resolved });
  } catch (err) {
    log('error', { action: 'paste', message: err.message });
    res.status(400).json({ error: err.message });
  }
});

router.post('/append', (req, res) => {
  try {
    const { path: filePath, content = '' } = req.body || {};
    const resolved = validatePath(filePath);
    fs.appendFileSync(resolved, content, 'utf8');
    verifyPublicFile(resolved);
    log('append', { path: resolved });
    res.json({ ok: true, path: resolved });
  } catch (err) {
    log('error', { action: 'append', message: err.message });
    res.status(400).json({ error: err.message });
  }
});

router.post('/replace', (req, res) => {
  try {
    const { path: filePath, pattern, replacement } = req.body || {};
    if (!filePath || pattern === undefined || replacement === undefined) {
      return res.status(400).json({ error: 'invalid_body' });
    }
    const resolved = validatePath(filePath);
    const regex = new RegExp(pattern, 'g');
    const text = fs.readFileSync(resolved, 'utf8').replace(regex, replacement);
    fs.writeFileSync(resolved, text, 'utf8');
    verifyPublicFile(resolved);
    log('replace', { path: resolved, pattern });
    res.json({ ok: true, path: resolved });
  } catch (err) {
    log('error', { action: 'replace', message: err.message });
    res.status(400).json({ error: err.message });
  }
});

router.post('/restart', (req, res) => {
  const { service } = req.body || {};
  if (!service) return res.status(400).json({ error: 'service_required' });
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
  const { target } = req.body || {};
  let cmd = '';
  if (target === 'frontend') cmd = 'cd /srv/blackroad-frontend && npm run build';
  else if (target === 'api') cmd = 'cd /srv/blackroad-api && npm install';
  else if (target === 'llm') cmd = 'cd /srv/lucidia-llm && pip install -r requirements.txt';
  else if (target === 'math') cmd = 'cd /srv/lucidia-math && pip install -r requirements.txt';
  else return res.status(400).json({ error: 'unknown_target' });

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      log('error', { action: 'build', message: err.message });
      return res.status(500).json({ error: err.message, stderr });
    }
    log('build', { target });
    res.json({ ok: true, target, stdout, stderr });
  });
});

module.exports = router;
