import { execSync as sh } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX = 200 * 1024;
const mentionAliases = [
  '@codex',
  '@cadillac',
  '@lucidia',
  '@bbpteam',
  '@blackboxprogramming',
];
const escapeForRegex = (value) =>
  value.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
const aliasPattern = mentionAliases
  .map((alias) => escapeForRegex(alias))
  .join('|');
const leadingAliasPattern = new RegExp(
  `^(?:${aliasPattern})(?:\\s+(?:${aliasPattern}))*`,
  'i'
);
const fixCommentsPattern = new RegExp(
  `^(?:${aliasPattern})(?:\\s+(?:${aliasPattern}))*\\s+fix comments`,
  'i'
);

let body = (process.env.CODEX_BODY || '').replace(/\r/g, '');
if (leadingAliasPattern.test(body)) {
  if (fixCommentsPattern.test(body)) {
    body = body.replace(
      fixCommentsPattern,
      '/codex apply .github/prompts/codex-fix-comments.md'
    );
  } else {
    body = body.replace(leadingAliasPattern, '/codex');
  }
}
const perm = process.env.CODEX_PERMISSION || '';
let body = (process.env.CODEx_BODY || '').replace(/\r/g, '');
if (body.startsWith('@codex')) {
  if (/^@codex\s+fix comments/i.test(body)) {
    body = body.replace(
      /^@codex\s+fix comments/i,
      '/codex apply .github/prompts/codex-fix-comments.md'
    );
  } else {
    body = body.replace(/^@codex/, '/codex');
  }
}
const perm = process.env.CODEx_PERMISSION || '';
if (!/(write|admin|maintain|triage)/.test(perm)) {
  console.log('not collaborator');
  process.exit(0);
}
const repo =
  (body.match(
    /\/codex\s+repo\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\s+([A-Za-z0-9._\/-]+))?/
  ) || [])[1] || '';
const branch =
  (body.match(/\/codex\s+repo\s+[^\s]+\s+([A-Za-z0-9._\/-]+)/) || [])[1] || '';
const apply = /\/codex\s+apply\b/.test(body),
  patch = /\/codex\s+patch\b/.test(body);
function run(cmd) {
  return sh(cmd, { stdio: 'pipe', encoding: 'utf8' });
}
let body = (process.env.CODEx_BODY || '').replace(/\r/g, '');
if (body.startsWith('@codex')) {
  if (/^@codex\s+fix comments/i.test(body)) {
    body = body.replace(
      /^@codex\s+fix comments/i,
      '/codex apply .github/prompts/codex-fix-comments.md'
    );
  } else {
    body = body.replace(/^@codex/, '/codex');
  }
}
const perm = process.env.CODEx_PERMISSION || '';
if (!/(write|admin|maintain|triage)/.test(perm)) {
  console.log('not collaborator');
  process.exit(0);
}
const repo =
  (body.match(
    /\/codex\s+repo\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\s+([A-Za-z0-9._\/-]+))?/
  ) || [])[1] || '';
const branch =
  (body.match(/\/codex\s+repo\s+[^\s]+\s+([A-Za-z0-9._\/-]+)/) || [])[1] || '';
const apply = /\/codex\s+apply\b/.test(body),
  patch = /\/codex\s+patch\b/.test(body);
function run(cmd) {
  return sh(cmd, { stdio: 'pipe', encoding: 'utf8' });
}
function checkoutTarget() {
  if (!repo) return;
  const t = process.env.BOT_TOKEN || '';
  if (!t) throw new Error('BOT_TOKEN required');
  const url = `https://${t}@github.com/${repo}.git`;
  run('rm -rf .codex-target && mkdir -p .codex-target');
  run(`git clone --quiet ${url} .codex-target`);
  process.chdir('.codex-target');
  try {
    run(`git checkout ${branch || 'main'}`);
  } catch {
    run(`git checkout -b ${branch || 'main'}`);
  }
}
function addfile(p, d) {
  if (Buffer.byteLength(d, 'utf8') > MAX) throw new Error('block too large');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, d, 'utf8');
  run(`git add ${JSON.stringify(p)}`);
}
function applydiff(d) {
  fs.writeFileSync('.codex.patch', d);
  try {
    run('git apply --whitespace=fix .codex.patch');
  } catch {
    run('git apply --3way .codex.patch');
  }
  fs.rmSync('.codex.patch', { force: true });
}
function polish() {
  try {
    run('npm -v');
  } catch {
    return;
  }
  try {
    run(
      'npm i -D prettier eslint eslint-config-prettier >/dev/null 2>&1 || true',
      { shell: '/bin/bash' }
    );
  } catch {}
  try {
    run('npx --yes prettier -w . >/dev/null 2>&1 || true', {
      shell: '/bin/bash',
    });
  } catch {}
  try {
    run(
      'npx --yes eslint . --ext .js,.mjs,.cjs --fix >/dev/null 2>&1 || true',
      { shell: '/bin/bash' }
    );
  } catch {}
  try {
    if (fs.existsSync('package.json')) {
      const j = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      j.scripts = j.scripts || {};
      j.scripts.test = j.scripts.test || 'echo "No tests specified" && exit 0';
      fs.writeFileSync('package.json', JSON.stringify(j, null, 2));
      run('git add package.json');
      run('npm test >/dev/null 2>&1 || true', { shell: '/bin/bash' });
    }
  } catch {}
}
(function () {
  const rePath = /```(?:\w+)?\s*path=([^\n]+)\n([\s\S]*?)```/g,
    reDiff = /```diff\n([\s\S]*?)```/g;
  if (!apply && !patch) {
    console.log('no codex command');
    return;
  }
  if (repo) checkoutTarget();
  run(`git config user.name "${process.env.BOT_USER || 'blackroad-bot'}"`);
  run(
    `git config user.email "${process.env.BOT_USER || 'blackroad-bot'}@users.noreply.github.com"`
  );
  let w = 0,
    p = 0,
    m;
  while ((m = rePath.exec(body)) && apply) {
    addfile(m[1].trim(), m[2]);
    w++;
  }
  while ((m = reDiff.exec(body)) && patch) {
    applydiff(m[1]);
    p++;
  }
  }
  while ((m = reDiff.exec(body)) && patch) {
    applydiff(m[1]);
    p++;
  }
  polish();
  try {
    run(`git add -A`);
  } catch {}
  try {
    run(
      `git commit -m "chore(codex): ${w ? `apply ${w} file(s)` : ''}${p ? `${w ? ' & ' : ''}patch ${p}` : ''}"`
    );
  } catch {}
  const tok = process.env.BOT_TOKEN || '';
  if (!tok) {
    console.log('no BOT_TOKEN; no push');
    return;
  }
  const r = process.env.GITHUB_REPOSITORY;
  const br = run('git rev-parse --abbrev-ref HEAD').trim();
  try {
    run(`git push https://${tok}@github.com/${r}.git HEAD:${br}`);
    console.log('pushed');
  } catch {
    console.log('push failed');
  }
})();
