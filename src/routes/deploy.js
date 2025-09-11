'use strict';

const express = require('express');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { DEPLOY_WEBHOOK_SECRET, ALLOW_DEPLOY_RUN } = require('../config');

const router = express.Router();

// Verify GitHub-style signature header if present
function verifySignature(req) {
  if (!DEPLOY_WEBHOOK_SECRET) return false;
  const sig = req.get('X-Hub-Signature-256');
  if (!sig || !sig.startsWith('sha256=')) return false;
  const hmac = crypto.createHmac('sha256', DEPLOY_WEBHOOK_SECRET);
  const payload = JSON.stringify(req.body || {});
  hmac.update(payload);
  const digest = 'sha256=' + hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
  } catch {
    return false;
  }
}

router.post('/webhook', express.json({ limit: '1mb' }), (req, res) => {
  const secret = req.get('X-BlackRoad-Secret');
  const sigOk = verifySignature(req) || (DEPLOY_WEBHOOK_SECRET && secret === DEPLOY_WEBHOOK_SECRET);
  if (!sigOk) return res.status(403).json({ ok: false, error: 'invalid_signature' });

  if (!ALLOW_DEPLOY_RUN) {
    return res.json({ ok: true, received: true, ran: false, note: 'ALLOW_DEPLOY_RUN=false' });
  }

  // Run deploy script
  const child = spawn('/bin/bash', ['-lc', 'bash scripts/deploy.sh'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true
  });
  child.unref();

  res.json({ ok: true, received: true, ran: true });
});

module.exports = router;
