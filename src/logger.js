'use strict';

function log(...args) {
  console.log('[blackroad-api]', ...args);
}

function warn(...args) {
  console.warn('[blackroad-api][WARN]', ...args);
}

function error(...args) {
  console.error('[blackroad-api][ERROR]', ...args);
}

module.exports = { log, warn, error };
