const express = require('express');
const { listProviders, providerHealth } = require('../lib/providers');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(listProviders());
});

router.get('/:name/health', (req, res) => {
  const info = providerHealth(req.params.name);
  if (!info) return res.status(404).json({ error: 'unknown_provider' });
  res.json(info);
});

router.post('/:name/test', (req, res) => {
  const { prompt } = req.body || {};
  res.json({ provider: req.params.name, prompt, result: 'not implemented' });
});

module.exports = router;
