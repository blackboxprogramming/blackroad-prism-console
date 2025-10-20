const fs = require('fs');
const path = require('path');
const { registerAgent } = require('../../AGENT_TABLE');

function spawnAll() {
  const baseDir = __dirname;
  const agents = fs.readdirSync(baseDir).filter((f) => {
    const full = path.join(baseDir, f);
    return fs.statSync(full).isDirectory();
  });
  agents.forEach((dir) => {
    const agent = require(path.join(__dirname, dir));
    registerAgent(agent);
  });
}

module.exports = { spawnAll };
