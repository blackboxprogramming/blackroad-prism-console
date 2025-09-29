'use strict';

const express = require('express');
const { requireAuth } = require('../auth');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

function errorMessage(err) {
  if (!err) return 'unknown_error';
  if (typeof err === 'string') return err;
  if (err && typeof err.message === 'string') return err.message;
  return 'unknown_error';
}

router.get('/system', requireAuth, async (_req, res) => {
  try {
    const snapshot = await dashboardService.getSystemSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: 'dashboard_system_failed', detail: errorMessage(err) });
  }
});

router.get('/feed', requireAuth, (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200);
  const events = dashboardService.getFeed(limit);
  res.json({ events });
});

module.exports = router;
