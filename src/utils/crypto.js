'use strict';

const crypto = require('crypto');

function hmacSHA256Hex(key, payload) {
  const h = crypto.createHmac('sha256', key);
  h.update(payload);
  return h.digest('hex');
}

module.exports = { hmacSHA256Hex };
