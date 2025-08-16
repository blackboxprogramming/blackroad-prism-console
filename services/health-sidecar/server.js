/* eslint-env node */
/* global process, console */
import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8088;
const API_ROOT = process.env.API_ROOT || '/var/www/blackroad/api';
const HEALTH_FILE = path.join(API_ROOT, 'health.json');

// simple cache-control for JSON
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// GET /api/health  (primary)
app.get('/api/health', (_req, res) => {
  let body = {
    status: 'ok',
    app: 'quantum-v3',
    version: 'v3.0.0',
    commit: process.env.COMMIT_SHA || 'unknown',
    ts: new Date().toISOString(),
  };
  try {
    if (fs.existsSync(HEALTH_FILE)) {
      const file = JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf8'));
      body = { ...file, status: 'ok' };
    }
  } catch (e) {
    body.status = 'degraded';
    body.error = String(e?.message || e);
  }
  res.json(body);
});

// Liveness/Readiness (K8s or uptime monitors)
app.get('/livez', (_req, res) => res.send('OK'));
app.get('/readyz', (_req, res) => {
  try {
    fs.accessSync(API_ROOT, fs.constants.R_OK);
    return res.send('READY');
  } catch {
    return res.status(503).send('NOT_READY');
  }
});

app.listen(PORT, () => {
  console.log(`[health-sidecar] listening on :${PORT}`);
});
