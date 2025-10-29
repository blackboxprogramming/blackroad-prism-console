const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { registerAgent, unregisterAgent } = require('../../prism/agentTable');

const name = 'cecilia';
const manifest = require('./manifest.json');
const agentId = manifest.agentId;
const profile = manifest.profile || {};

const prismRoot = path.resolve(__dirname, '../../prism');
const logDir = path.join(prismRoot, 'logs');
const logFile = path.join(logDir, `${name}.log`);

fs.mkdirSync(logDir, { recursive: true });

function logMessage(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);
}

function sendMessage(message) {
  process.stdout.write(`${message}\n`);
}

function recvMessage(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return;
  }
  if (trimmed === 'ping') {
    logMessage('received ping');
    sendMessage(`pong: ${name}`);
    return;
  }
  if (trimmed === 'profile') {
    logMessage('profile requested');
    sendMessage(JSON.stringify({ agentId, profile }));
    return;
  }
  logMessage(`unknown command: ${trimmed}`);
}

registerAgent(name, { pid: process.pid, agentId });
logMessage('cecilia agent started');

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', recvMessage);
rl.on('close', () => {
  logMessage('stdin closed');
});

process.on('SIGINT', () => {
  logMessage('received SIGINT');
  process.exit(0);
});

process.on('exit', () => {
  unregisterAgent(name);
  logMessage('cecilia agent stopped');
});
