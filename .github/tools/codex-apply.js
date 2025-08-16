/* eslint-env node */
/* eslint-disable no-undef, no-unused-vars */
/**
 * Codex Apply — parse issue/PR comment for /codex commands and apply changes.
 * Supported:
 *   /codex apply
 *     ```path=relative/path.ext
 *     <file contents>
 *     ```
 *     (repeat multiple blocks)
 *
 *   /codex patch
 *     ```diff
 *     <unified diff>
 *     ```
 *
 *   /codex repo org/name [branch]
 *     (precede apply/patch blocks to target another repo)
 *
 * Limits: 200KB per block, collaborators only.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BLOCK = 200 * 1024;

function sh(cmd, opts={}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

function isCollaborator() {
  // Basic check: ensure event is from a repo member/collaborator
  const perm = process.env.CODEx_PERMISSION || '';
  // When invoked from GH Actions, we can pass this via the workflow's github-script
  return /write|admin|maintain|triage/.test(perm);
}

function parseCommand(body) {
  // normalize CRLF
  const text = body.replace(/\r/g,'').trim();

  // detect target repo: `/codex repo org/name [branch]`
  const repoMatch = text.match(/\/codex\s+repo\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\s+([A-Za-z0-9._/-]+))?/);
  const targetRepo = repoMatch?.[1] || '';
  const targetBranch = repoMatch?.[2] || '';

  const isApply = /\/codex\s+apply\b/.test(text);
  const isPatch = /\/codex\s+patch\b/.test(text);

  // collect code blocks
  const blocks = [];
  // path-based blocks: ```path=foo/bar.ext\n...```
  const rePath = /```(?:\w+)?\s*path=([^\n]+)\n([\s\S]*?)```/g;
  let m;
  while ((m = rePath.exec(text))) {
    blocks.push({ type: 'file', path: m[1].trim(), data: m[2] });
  }

  // diff blocks: ```diff\n...```
  const reDiff = /```diff\n([\s\S]*?)```/g;
  while ((m = reDiff.exec(text))) {
    blocks.push({ type: 'diff', data: m[1] });
  }

  return { isApply, isPatch, blocks, targetRepo, targetBranch };
}

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(p, data) {
  if (Buffer.byteLength(data, 'utf8') > MAX_BLOCK) {
    throw new Error(`Block too large (> ${MAX_BLOCK} bytes): ${p}`);
  }
  ensureDirFor(p);
  fs.writeFileSync(p, data, 'utf8');
}

function applyDiff(diffText) {
  fs.writeFileSync('.codex.patch', diffText, 'utf8');
  try {
    sh('git apply --whitespace=fix .codex.patch');
  } catch (e) {
    // Try with 3-way if simple apply fails
    try { sh('git apply --3way .codex.patch'); }
    catch (e2) { throw new Error('Failed to apply diff (even with 3-way)'); }
  } finally {
    fs.rmSync('.codex.patch', { force: true });
  }
}

function npmPolish() {
  try { sh('npm -v'); } catch { return; }
  try { sh('npm i -D prettier eslint eslint-config-prettier >/dev/null 2>&1 || true', { shell: '/bin/bash' }); } catch { /* empty */ }
  try { sh('npx --yes prettier -w . >/dev/null 2>&1 || true', { shell: '/bin/bash' }); } catch { /* empty */ }
  try { sh('npx --yes eslint . --ext .js,.mjs,.cjs --fix >/dev/null 2>&1 || true', { shell: '/bin/bash' }); } catch { /* empty */ }
  // safe tests
  try {
    if (fs.existsSync('package.json')) {
      const j = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!j.scripts) j.scripts = {};
      if (!j.scripts.test) {
        j.scripts.test = 'echo "No tests specified" && exit 0';
        fs.writeFileSync('package.json', JSON.stringify(j, null, 2));
        sh('git add package.json');
      }
      sh('npm test >/dev/null 2>&1 || true', { shell: '/bin/bash' });
    }
    } catch { /* empty */ }
}

function gitCommitAll(msg) {
  try { sh('git add -A'); } catch { /* empty */ }
  try { sh(`git commit -m ${JSON.stringify(msg)}`); } catch { /* empty */ }
}

function gitPushBranch() {
  const token = process.env.BOT_TOKEN || '';
  if (!token) return 'No BOT_TOKEN; not pushing.';
  const repo = process.env.GITHUB_REPOSITORY;
  const branch = sh('git rev-parse --abbrev-ref HEAD').trim();
  try {
    sh(`git push https://${token}@github.com/${repo}.git HEAD:${branch}`);
    return `Pushed ${branch}`;
  } catch (e) {
    return 'Push failed — check token/permissions.';
  }
}

function checkoutTargetRepo(targetRepo, targetBranch) {
  if (!targetRepo) return;
  const token = process.env.BOT_TOKEN || '';
  if (!token) throw new Error('BOT_TOKEN required for cross-repo apply');
  const url = `https://${token}@github.com/${targetRepo}.git`;
  sh('rm -rf .codex-target && mkdir -p .codex-target');
  sh(`git clone --quiet ${url} .codex-target`);
  process.chdir('.codex-target');
  const br = targetBranch || 'main';
  try { sh(`git checkout ${br}`); } catch { sh(`git checkout -b ${br}`); }
}

async function main() {
  const body = process.env.CODEx_BODY || '';
  const { isApply, isPatch, blocks, targetRepo, targetBranch } = parseCommand(body);

  if (!isCollaborator()) {
    console.log('Only collaborators can run Codex Bridge. Skipping.');
    return;
  }
  if (!isApply && !isPatch) {
    console.log('No /codex apply or /codex patch found. Skipping.');
    return;
  }

  if (targetRepo) {
    checkoutTargetRepo(targetRepo, targetBranch);
  }

  // basic identity
  const botUser = process.env.BOT_USER || 'blackroad-bot';
  sh(`git config user.name "${botUser}"`);
  sh(`git config user.email "${botUser}@users.noreply.github.com"`);

  let wrote = 0, patched = 0;

  for (const b of blocks) {
    if (b.type === 'file' && isApply) {
      writeFileSafe(b.path, b.data);
      sh(`git add ${JSON.stringify(b.path)}`);
      wrote++;
    } else if (b.type === 'diff' && isPatch) {
      applyDiff(b.data);
      patched++;
    }
  }

  // polish & commit
  npmPolish();
  gitCommitAll(`chore(codex): ${wrote?`apply ${wrote} file(s)`:''}${patched?`${wrote?' & ':''}patch ${patched}`:''}`.trim() || 'chore(codex): update');
  const result = gitPushBranch();
  console.log(`Codex Bridge: wrote=${wrote}, patched=${patched}. ${result}`);
}

main().catch(e => { console.error(e.message || e); process.exit(0); });
