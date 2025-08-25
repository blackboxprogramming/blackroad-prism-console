<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/logger.ts -->
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');
try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
const logFile = path.join(logDir, 'lucidia-brain.log');

function log(event, data) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n';
  fs.appendFile(logFile, line, err => { if (err) console.error('[lbrain:logger]', err); });
}

module.exports = { log, logFile };
