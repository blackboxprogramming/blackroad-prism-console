<!-- FILE: srv/blackroad-api/lib/log.js -->
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = '/var/log/blackroad-api';
fs.mkdirSync(logDir, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: path.join(logDir, 'app.log') }),
    new transports.Console(),
  ],
});

module.exports = logger;
