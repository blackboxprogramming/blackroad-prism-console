const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const REPO_PATH = process.env.GIT_REPO_PATH || '/srv/blackroad';
const REMOTE_NAME = process.env.GIT_REMOTE_NAME || 'origin';
const ALLOW_GIT_ACTIONS = String(process.env.ALLOW_GIT_ACTIONS || 'false').toLowerCase() === 'true';

function runGit(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: REPO_PATH }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

router.get('/health', async (_req, res) => {
  try {
    let remoteUrl = '';
    try {
      const out = await runGit(['remote', 'get-url', REMOTE_NAME]);
      remoteUrl = out.stdout.trim();
    } catch {}
    res.json({
      ok: true,
      repoPath: REPO_PATH,
      readOnly: !ALLOW_GIT_ACTIONS,
      remote: { name: REMOTE_NAME, urlPresent: remoteUrl.length > 0 },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/status', async (_req, res) => {
  try {
    const { stdout } = await runGit(['status', '--porcelain=2', '--branch']);
    const lines = stdout.trim().split('\n');
    let branch = '';
    let ahead = 0;
    let behind = 0;
    let staged = 0;
    let unstaged = 0;
    let untracked = 0;
    for (const line of lines) {
      if (line.startsWith('# branch.head')) {
        branch = line.split(' ')[2] || '';
      } else if (line.startsWith('# branch.ab')) {
        const parts = line.split(' ');
        ahead = parseInt(parts[2].replace('+', ''), 10) || 0;
        behind = parseInt(parts[3].replace('-', ''), 10) || 0;
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        const code = line.split(' ')[1];
        if (code[0] !== '.') staged++;
        if (code[1] !== '.') unstaged++;
      } else if (line.startsWith('? ')) {
        untracked++;
      }
    }
    const isDirty = staged > 0 || unstaged > 0 || untracked > 0;
    const shortHash = (await runGit(['rev-parse', '--short', 'HEAD'])).stdout.trim();
    const lastCommitMsg = (await runGit(['log', '-1', '--pretty=%s'])).stdout.trim();
    res.json({
      branch,
      ahead,
      behind,
      isDirty,
      counts: { staged, unstaged, untracked },
      shortHash,
      lastCommitMsg,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
