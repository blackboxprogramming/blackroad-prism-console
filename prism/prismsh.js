const fs = require('fs');
const path = require('path');

const PRISM_ROOT = __dirname;
const LOG_DIR = path.join(PRISM_ROOT, 'logs');
const CONTR_DIR = path.join(PRISM_ROOT, 'contradictions');
const AGENTS_DIR = path.join(PRISM_ROOT, 'agents');
const IPC_DIR = path.join(PRISM_ROOT, 'ipc');
const SNAP_DIR = path.join(PRISM_ROOT, 'snapshots');
const SYM_DIR = path.join(PRISM_ROOT, 'symphonies');

[LOG_DIR, CONTR_DIR, AGENTS_DIR, IPC_DIR, SNAP_DIR, SYM_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const AGENT_TABLE = new Map();
const AGENTS_ROOT = path.join(__dirname, '..', 'agents');

function discoverAgents() {
  return fs
    .readdirSync(AGENTS_ROOT)
    .filter((name) => {
      const agentDir = path.join(AGENTS_ROOT, name);
      return (
        fs.existsSync(path.join(agentDir, 'manifest.json')) &&
        fs.existsSync(path.join(agentDir, 'index.js'))
      );
    });
}

function loadAgent(name) {
  const agentDir = path.join(AGENTS_ROOT, name);
  const manifest = JSON.parse(fs.readFileSync(path.join(agentDir, 'manifest.json'), 'utf8'));
  const mod = require(path.join(agentDir, 'index.js'));
  fs.writeFileSync(path.join(AGENTS_DIR, `${name}.json`), JSON.stringify(manifest));
  fs.writeFileSync(path.join(LOG_DIR, `${name}.log`), '');
  fs.writeFileSync(path.join(IPC_DIR, name), '');
  AGENT_TABLE.set(name, { manifest, handler: mod.handle });
}

function spawnElite() {
  discoverAgents().forEach(loadAgent);
  return Array.from(AGENT_TABLE.keys());
}

function send(agentName, type, payload={}) {
  const entry = AGENT_TABLE.get(agentName);
  if (!entry) throw new Error(`unknown agent ${agentName}`);
  const msg = { type, ...payload };
  fs.appendFileSync(path.join(IPC_DIR, agentName), JSON.stringify(msg) + '\n');
  return entry.handler(msg);
}

function ping(agentName) {
  return send(agentName, 'ping');
}

function analyze(agentName, file) {
  return send(agentName, 'analyze', { path: file });
}

function codegen(agentName, spec) {
  return send(agentName, 'codegen', { spec });
}

module.exports = { spawnElite, ping, analyze, codegen, AGENT_TABLE };
