const { execSync } = require('child_process');

let built = false;

function ensureGatewayBuilt() {
  if (!built) {
    execSync('npx tsc -p packages/graph-engines/tsconfig.json', { stdio: 'ignore' });
    execSync('npx tsc -p packages/graph-gateway/tsconfig.json', { stdio: 'ignore' });
    built = true;
  }
}

module.exports = { ensureGatewayBuilt };
