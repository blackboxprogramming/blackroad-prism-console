import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import gitServiceModule from '../var/www/blackroad/server/routes/git-service.js';

const execFileAsync = promisify(execFile);
const gitService = gitServiceModule.default || gitServiceModule;

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'git-router-'));
const previousRoot = process.env.GIT_REPO_ROOT;

try {
  await execFileAsync('git', ['init'], { cwd: tmpRoot });
  await execFileAsync('git', ['config', 'user.email', 'git@example.com'], { cwd: tmpRoot });
  await execFileAsync('git', ['config', 'user.name', 'Git Test'], { cwd: tmpRoot });
  await fs.writeFile(path.join(tmpRoot, 'notes.txt'), 'hello\n');
  await execFileAsync('git', ['add', 'notes.txt'], { cwd: tmpRoot });
  await execFileAsync('git', ['commit', '-m', 'initial commit'], { cwd: tmpRoot });

  process.env.GIT_REPO_ROOT = tmpRoot;

  const health = await gitService.gitHealth();
  assert.equal(health.ok, true);
  assert.equal(health.insideWorkTree, true);

  const status = await gitService.gitStatus();
  assert.ok(status.branch);

  let changes = await gitService.gitChanges();
  assert.equal(changes.staged.length, 0);
  assert.equal(changes.unstaged.length, 0);

  await fs.writeFile(path.join(tmpRoot, 'notes.txt'), 'hello world\n');
  await gitService.gitStage(['notes.txt']);

  changes = await gitService.gitChanges();
  assert.equal(changes.staged.length, 1);

  const commitResult = await gitService.gitCommit({ subject: 'feat: update notes' });
  assert.equal(commitResult.ok, true);
  assert.equal(commitResult.commit.subject, 'feat: update notes');

  const history = await gitService.gitHistory({ limit: 2 });
  assert.ok(Array.isArray(history.history));
  assert.ok(history.history.length >= 1);
  assert.equal(history.history[0].subject, 'feat: update notes');

  await fs.writeFile(path.join(tmpRoot, 'scratch.txt'), 'temp\n');
  await gitService.gitStage(['scratch.txt']);
  await gitService.gitUnstage(['scratch.txt']);
  changes = await gitService.gitChanges();
  assert.ok(changes.unstaged.some((entry) => entry.path === 'scratch.txt'));
} finally {
  if (previousRoot === undefined) delete process.env.GIT_REPO_ROOT;
  else process.env.GIT_REPO_ROOT = previousRoot;
  await fs.rm(tmpRoot, { recursive: true, force: true });
}
