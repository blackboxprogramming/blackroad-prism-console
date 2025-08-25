#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const { AGENT_TABLE, registerAgent, unregisterAgent } = require('./agentTable');

const agents = [
  'logger','guardian','roadie','quantum','search','visual','emotional',
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
