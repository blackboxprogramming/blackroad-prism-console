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
const { spawnAll } = require('./agents/novelty');
const { getAgent } = require('./AGENT_TABLE');

function ensure() {
  if (!getAgent('love')) {
    spawnAll();
  }
}

const [,, cmd, arg1, arg2] = process.argv;

if (cmd === 'spawn' && arg1 === 'novelty') {
  spawnAll();
  console.log('novelty agents spawned');
} else if (cmd === 'ask') {
  ensure();
  const agent = arg1;
  const input = arg2 || '';
  const rt = getAgent(agent);
  if (!rt) {
    console.error('unknown agent');
    process.exit(1);
  }
  const res = rt.ping(input);
  console.log(res);
} else if (cmd === 'dream') {
  ensure();
  const res = getAgent('dream').ping('');
  console.log(res);
} else {
  console.log('usage: node prism/prismsh.js spawn novelty| ask <agent> <input>| dream');
#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const { AGENT_TABLE, registerAgent, unregisterAgent } = require('./agentTable');

const agents = [
  'logger','guardian','roadie','cecilia','quantum','search','visual','emotional',
  'truth','spiral','auth','file','co_creation','dashboard','integration','deployment'
];

const cmd = process.argv[2];

switch (cmd) {
  case 'agents':
    console.log(agents.join('\n'));
    break;
  case 'spawn':
    {
      const name = process.argv[3];
      if (!agents.includes(name)) {
        console.error('unknown agent');
        process.exit(1);
      }
      const proc = spawn('node', [path.join(__dirname, '..', 'agents', name, 'index.js')], {
        stdio: 'ignore',
      });
      registerAgent(name, { pid: proc.pid, proc });
      console.log(`spawned ${name}`);
    }
    break;
  case 'kill':
    {
      const name = process.argv[3];
      const entry = AGENT_TABLE.get(name);
      if (entry) {
        entry.proc.kill();
        unregisterAgent(name);
        console.log(`killed ${name}`);
      } else {
        console.error('not running');
      }
    }
    break;
  default:
    console.log('usage: prismsh agents|spawn <agent>|kill <agent>');
}
