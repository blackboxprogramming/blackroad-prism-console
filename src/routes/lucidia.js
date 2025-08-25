'use strict';

const express = require('express');
const { requireAuth } = require('../auth');
const llmService = require('../services/llmService');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'lucidia' });
});

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ ok: false, error: 'invalid_messages' });
    }
    const result = await llmService.chat(messages);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'lucidia_failed', detail: String(e) });
  }
});

module.exports = router;
