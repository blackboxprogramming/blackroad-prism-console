const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AGENTS, spawnAll, killAll, ping } = require('../modules/mega_agents');

const base = path.join(__dirname, '..', 'prism');

// spawn all agents and verify ping responses and log creation
spawnAll();

for (const name of AGENTS) {
  const res = ping(name);
  assert.strictEqual(res, `pong: ${name}`);
  const logPath = path.join(base, 'logs', `${name}.log`);
  assert.ok(fs.existsSync(logPath), `log missing for ${name}`);
}

// spot-check contradiction file for contradiction2
const contradictionPath = path.join(base, 'contradictions', 'contradiction2');
assert.ok(fs.existsSync(contradictionPath), 'contradiction file missing for contradiction2');

killAll();
console.log('All agents responded with expected pong and logs.');
