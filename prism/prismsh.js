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
}
