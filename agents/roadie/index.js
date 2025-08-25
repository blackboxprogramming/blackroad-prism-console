const fs = require('fs');
const path = require('path');
const { registerAgent, unregisterAgent } = require('../../prism/agentTable');
const name = 'roadie';
const prismRoot = path.resolve(__dirname, '../../prism');
const agentDir = path.join(prismRoot, 'agents', name);
const logDir = path.join(prismRoot, 'logs');
const logFile = path.join(logDir, `${name}.log`);
const ipcDir = path.join(prismRoot, 'ipc', name);
const contradictionsDir = path.join(prismRoot, 'contradictions');
const contradictionsFile = path.join(contradictionsDir, `${name}.json`);
fs.mkdirSync(agentDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });
fs.mkdirSync(ipcDir, { recursive: true });
fs.mkdirSync(contradictionsDir, { recursive: true });
const manifest = require('./manifest.json');
fs.writeFileSync(path.join(agentDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
function logMessage(msg) {
  fs.appendFileSync(logFile, msg + '\n');
}
function sendMessage(msg) {
  process.stdout.write(msg + '\n');
}
function recvMessage(line) {
  if (line.trim() === 'ping') {
    sendMessage('pong: ' + name);
  }
}
if (name === 'truth' || name === 'guardian') {
  if (!fs.existsSync(contradictionsFile)) {
    fs.writeFileSync(contradictionsFile, '[]');
  }
}
registerAgent(name, { pid: process.pid });
logMessage('started');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', recvMessage);
process.on('exit', () => {
  unregisterAgent(name);
});
