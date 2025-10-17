const express = require('express');

const router = express.Router();

router.get('/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/ready', (_req, res) => {
  res.status(200).json({ status: 'ready' });
});

module.exports = router;
