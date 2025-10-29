const fs = require('fs');
const path = require('path');

// List of core agents (15) and extended mega-pack agents (>50)
const AGENTS = [
  // core agents
  'logger','guardian','roadie','cecilia','quantum','search','visual','emotional','truth','spiral','auth','file','co_creation','dashboard','integration','deployment',
  // science & math
  'algebra','calculus','physics','chemistry','genetics','astronomy','chaos','wave','fractal2','tensor','stats',
  // ai & reasoning
  'planner','reasoner','debate','contradiction2','paradox','translator','summarizer','classifier','vision','speech',
  // business & finance
  'accounting','budgeting','trading','crypto','roadcoin','roadchain','invoicing','risk','compliance','audit','pricing',
  // knowledge & search
  'encyclopedia','archive','news','docs','codegen','codex2','roadmap','roadmapAI','roadmapMath','roadmapOS',
  // creative & media
  'poet','storyteller','artist','composer','animator','designer','scene','voicesynth','scriptbuilder','generator',
  // system & ops
  'deployer2','rollback2','snapshot2','monitoring','metrics','logging2','alert','backup','cluster','orchestrator','scaler'
];

const base = path.join(__dirname, '..', 'prism');

function ensureBase() {
  ['agents', 'ipc', 'logs', 'contradictions'].forEach(dir => {
    const full = path.join(base, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }
  });
}

function spawnAgent(name) {
  ensureBase();
  fs.writeFileSync(path.join(base, 'agents', name), JSON.stringify({ name, version: '0.1', capabilities: ['ipc'] }));
  fs.writeFileSync(path.join(base, 'ipc', name), '');
  fs.writeFileSync(path.join(base, 'logs', `${name}.log`), '');
}

function killAgent(name) {
  ['agents', 'ipc', 'logs', 'contradictions'].forEach(dir => {
    const file = dir === 'logs' ? `${name}.log` : name;
    const full = path.join(base, dir, file);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { force: true });
    }
  });
}

function spawnAll() {
  AGENTS.forEach(spawnAgent);
}

function killAll() {
  AGENTS.forEach(killAgent);
}

function ping(name) {
  const msg = `pong: ${name}`;
  fs.appendFileSync(path.join(base, 'logs', `${name}.log`), msg + '\n');
  if (name === 'truth' || name === 'guardian' || name === 'contradiction2') {
    fs.writeFileSync(path.join(base, 'contradictions', name), 'contradiction detected');
  }
  return msg;
}

function agents() {
  return AGENTS.slice();
}

module.exports = { AGENTS, spawnAgent, killAgent, spawnAll, killAll, ping, agents };
