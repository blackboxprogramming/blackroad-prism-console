// FILE: /srv/blackroad-api/src/routes/metrics.js
'use strict';

const express = require('express');
const metricsService = require('../services/metricsService');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/system', requireAuth, async (req, res) => {
  try {
    const m = await metricsService.sample();
    res.json({ ok: true, metrics: m });
  } catch {
    res.status(500).json({ ok: false, error: 'metrics_failed' });
  }
});

module.exports = router;
