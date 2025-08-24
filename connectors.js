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
  }
});

router.post('/restart', (req, res) => {
  const { service } = req.body || {};
  if (!service) return res.status(400).json({ error: 'service_required' });
  exec(`systemctl restart ${service}`, (err, stdout, stderr) => {
    log('restart', service);
    if (err) return res.status(500).json({ error: err.message, stderr });
    res.json({ ok: true, stdout });
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
});

module.exports = router;
