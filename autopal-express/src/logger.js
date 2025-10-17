const fs = require('fs');
const path = require('path');
const { getConfig } = require('./config');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeAudit(event) {
  const config = getConfig();
  const payload = {
    timestamp: new Date().toISOString(),
    ...event
  };
  const serialized = JSON.stringify(payload);
  const logPath = path.resolve(config.auditLogPath);
  ensureDir(logPath);
  fs.appendFile(logPath, `${serialized}\n`, (error) => {
    if (error) {
      console.error('Failed to write audit log entry', error);
    }
  });
}

module.exports = {
  writeAudit
};
