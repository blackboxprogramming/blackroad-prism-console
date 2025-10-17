// FILE: /srv/blackroad-api/src/routes/health.js
'use strict';

const express = require('express');
const os = require('os');
const fs = require('fs');
const { DB_PATH } = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  let dbSize = null;
  try {
    const st = fs.statSync(DB_PATH);
    dbSize = st.size;
  } catch {}

  res.json({
    ok: true,
    service: 'blackroad-api',
    hostname: os.hostname(),
    now: new Date().toISOString(),
    dbPath: DB_PATH,
    dbSize
  });
});

module.exports = router;
