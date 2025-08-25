const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnAll } = require('../prism/agents/novelty/index.js');
const { getAgent, clearAgents } = require('../prism/AGENT_TABLE');

const agents = [
  'love','curious','consent','empathy','trust',
  'creativity','art','poetry','music','story',
  'math','geometry','infinity','sine','godel',
  'dream','paradox','oracle','game','mirror'
];

spawnAll();

agents.forEach((name) => {
  const agent = getAgent(name);
  assert(agent, `${name} loaded`);
  const resp = agent.ping('test');
  assert(resp && resp.length > 0, `${name} responded`);
  const logPath = path.join(__dirname, '..', 'prism', 'logs', name + '.log');
  assert(fs.existsSync(logPath), `${name} log exists`);
});

const contradictionPath = path.join(__dirname, '..', 'prism', 'contradictions', 'paradox.json');
assert(fs.existsSync(contradictionPath), 'paradox contradictions exist');

clearAgents();

console.log('novelty agent tests passed');
