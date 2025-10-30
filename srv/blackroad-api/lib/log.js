const pino = require('pino');
const { buildPinoRedactPaths } = require('./redact');
// FILE: srv/blackroad-api/lib/log.js
// <!-- FILE: srv/blackroad-api/lib/log.js -->
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const DEBUG_MODE =
  String(process.env.DEBUG_MODE || process.env.DEBUG_PROBES || 'false').toLowerCase() ===
  'true';

const level = process.env.LOG_LEVEL || (DEBUG_MODE ? 'debug' : 'info');

const transport =
  process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined;

const logger = pino({
  level,
  base: { service: 'blackroad-api' },
  redact: {
    paths: buildPinoRedactPaths(),
    censor: '[REDACTED]',
  },
  transport,
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: path.join(logDir, 'app.log') }),
    new transports.Console(),
  ],
});

module.exports = logger;
