const fs = require('fs');
const path = require('path');

const name = path.basename(__dirname);
const base = path.join(__dirname, '..', '..', 'prism');
const logDir = path.join(base, 'logs');
const contrDir = path.join(base, 'contradictions');

function ensure() {
  fs.mkdirSync(logDir, { recursive: true });
  fs.mkdirSync(contrDir, { recursive: true });
}

function log(msg) {
  ensure();
  fs.appendFileSync(path.join(logDir, `${name}.log`), msg + '\n');
}

function contradiction(detail) {
  ensure();
  fs.writeFileSync(path.join(contrDir, `${name}.json`), JSON.stringify({ detail }));
}

module.exports = {
  name,
  handle(msg) {
    switch (msg.type) {
      case 'ping':
        log('ping');
        return `pong: ${name}`;
      case 'analyze':
        log(`analyze:${msg.path}`);
        return 'analysis complete';
      case 'codegen':
        log(`codegen:${msg.spec}`);
        return `code stub for ${msg.spec}`;
      case 'contradiction':
        contradiction(msg.detail || 'unknown');
        return 'contradiction logged';
      default:
        return 'unknown';
    }
  }
};
