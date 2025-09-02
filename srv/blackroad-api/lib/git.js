const { execFile } = require('child_process');

const REPO_DIR = '/srv/blackroad-src';
const ALLOWED_BRANCHES = ['main', 'staging'];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: REPO_DIR }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

async function fetch() {
  await run('git', ['fetch', '--all', '--prune']);
}

async function revParse(ref) {
  return run('git', ['rev-parse', ref]);
}

async function checkout(branch) {
  if (!ALLOWED_BRANCHES.includes(branch)) throw new Error('branch_not_allowed');
  await run('git', ['checkout', branch]);
}

async function resetHard(ref) {
  await run('git', ['reset', '--hard', ref]);
}

async function clean() {
  await run('git', ['clean', '-fd']);
}

module.exports = { fetch, revParse, checkout, resetHard, clean, REPO_DIR, ALLOWED_BRANCHES };
