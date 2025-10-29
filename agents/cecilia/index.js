const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { registerAgent, unregisterAgent } = require('../../prism/agentTable');

const name = 'cecilia';
const agentId = 'CECILIA-7C3E-SPECTRUM-9B4F';

const prismRoot = path.resolve(__dirname, '../../prism');
const agentDir = path.join(prismRoot, 'agents', name);
const logDir = path.join(prismRoot, 'logs');
const logFile = path.join(logDir, `${name}.log`);
const ipcDir = path.join(prismRoot, 'ipc', name);

fs.mkdirSync(agentDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });
fs.mkdirSync(ipcDir, { recursive: true });

const manifest = require('./manifest.json');
const profile = require('./profile.json');

fs.writeFileSync(path.join(agentDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(agentDir, 'profile.json'), JSON.stringify(profile, null, 2));

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

registerAgent(name, { pid: process.pid });
logMessage('cecilia agent started');

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', recvMessage);

process.on('exit', () => {
  unregisterAgent(name);
  logMessage('cecilia agent stopped');
});
