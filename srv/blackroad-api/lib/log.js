const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = '/var/log/blackroad-api';
fs.mkdirSync(logDir, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.File({ filename: path.join(logDir, 'app.log') }),
    new transports.Console({ format: format.simple() })
  ]
});

module.exports = logger;
