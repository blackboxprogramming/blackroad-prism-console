'use strict';

const rateLimit = require('express-rate-limit');

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { strictLimiter };
