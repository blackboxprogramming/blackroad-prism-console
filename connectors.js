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
