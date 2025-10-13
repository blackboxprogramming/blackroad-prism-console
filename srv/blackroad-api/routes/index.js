const express = require('express');
const logSnapshot = require('../lib/snapshot');
const router = express.Router();

router.get('/health', async (_req, res) => {
  const payload = { ok: true, data: { status: 'ok' } };
  await logSnapshot(payload);
  res.json(payload);
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
