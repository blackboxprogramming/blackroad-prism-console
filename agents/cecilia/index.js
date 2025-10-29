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

registerAgent(name, { pid: process.pid });
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
'use strict';

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class CeciliaAgent extends EventEmitter {
  constructor({ memoryApiUrl = 'http://localhost:3000', statePath } = {}) {
    super();
    this.memoryApiUrl = memoryApiUrl;
    this.statePath = statePath || path.resolve(__dirname, '../../home/agents/cecilia/state/current.json');
    this.logPath = path.resolve(__dirname, '../../home/agents/cecilia/logs/session.log');
  }

  profile() {
    const state = this.#readState();
    return {
      id: state.agent_id,
      join_code: state.join_code,
      capabilities: ['memory:index', 'memory:search', 'status:report'],
      memory_backend: state.memory_backend,
    };
  }

  memorySummary() {
    const logExists = fs.existsSync(this.logPath);
    const logTail = logExists ? fs.readFileSync(this.logPath, 'utf8').trim().split('\n').slice(-5) : [];
    return {
      logTail,
      memoryApiUrl: this.memoryApiUrl,
    };
  }

  exportProfile() {
    const profilePath = path.resolve(__dirname, '../../home/agents/cecilia/memory/profile.json');
    const payload = {
      profile: this.profile(),
      memory: this.memorySummary(),
      exported_at: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(profilePath), { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify(payload, null, 2));
    return profilePath;
  }

  #readState() {
    try {
      const raw = fs.readFileSync(this.statePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      this.emit('error', error);
      return {
        agent_id: 'UNKNOWN',
        join_code: null,
        memory_backend: null,
      };
    }
  }
}

module.exports = {
  CeciliaAgent,
};
