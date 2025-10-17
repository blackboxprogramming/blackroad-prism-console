// FILE: /srv/blackroad-api/src/routes/llm.js
'use strict';

const express = require('express');
const { requireAuth } = require('../auth');
const llmService = require('../services/llmService');

const router = express.Router();

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ ok: false, error: 'invalid_messages' });
    }
    // Only non-streaming JSON for now
    const result = await llmService.chat(messages);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'llm_failed', detail: String(e) });
  }
});

module.exports = router;
