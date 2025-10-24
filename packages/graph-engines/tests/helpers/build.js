const { execSync } = require('child_process');

let built = false;

function ensureBuilt() {
  if (!built) {
    execSync('npx tsc -p packages/graph-engines/tsconfig.json', { stdio: 'ignore' });
    built = true;
  }
}

module.exports = { ensureBuilt };
