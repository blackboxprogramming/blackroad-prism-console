'use strict';

const express = require('express');
const { execFile } = require('child_process');
const path = require('path');

const router = express.Router();

const REPO_PATH = process.env.GIT_REPO_PATH || '/srv/blackroad';
const REMOTE_NAME = process.env.GIT_REMOTE_NAME || 'origin';
const READ_ONLY = String(process.env.ALLOW_GIT_ACTIONS || 'false').toLowerCase() !== 'true';

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

function sanitizeFile(f) {
  if (!/^[A-Za-z0-9._\/\-]+$/.test(f)) throw new Error('invalid_path');
  const abs = path.resolve(REPO_PATH, f);
  if (!abs.startsWith(path.resolve(REPO_PATH))) throw new Error('invalid_path');
  return path.relative(REPO_PATH, abs);
}

function readOnly(res) {
  return res
    .status(403)
    .json({ code: 'READ_ONLY', message: 'Server is in read-only mode' });
}

router.get('/health', async (_req, res) => {
  let remote = false;
  try {
    await runGit(['remote', 'get-url', REMOTE_NAME]);
    remote = true;
  } catch {}
  res.json({
    ok: true,
    repoPath: REPO_PATH,
    readOnly: READ_ONLY,
    remote: { name: REMOTE_NAME, urlPresent: remote },
  });
});

router.get('/status', async (_req, res) => {
  try {
    const { stdout } = await runGit(['status', '--porcelain=v2', '--branch']);
    const lines = stdout.trim().split('\n');
    let branch = '',
      ahead = 0,
      behind = 0;
    const staged = [],
      unstaged = [];
    for (const line of lines) {
      if (line.startsWith('# branch.head')) branch = line.split(' ')[2] || '';
      if (line.startsWith('# branch.ab')) {
        const parts = line.split(' ');
        ahead = parseInt(parts[2].split('=')[1] || '0');
        behind = parseInt(parts[3].split('=')[1] || '0');
      }
      if (line.startsWith('1 ')) {
        const parts = line.split(' ');
        const st = parts[1];
        const p = parts.slice(8).join(' ');
        if (st[0] !== ' ' && st[0] !== '?') staged.push({ path: p, status: st[0] });
        if (st[1] !== ' ') unstaged.push({ path: p, status: st[1] });
      }
      if (line.startsWith('? ')) {
        const p = line.slice(2);
        unstaged.push({ path: p, status: '?' });
      }
    }
    const dirty = staged.length > 0 || unstaged.length > 0;
    const { stdout: hashOut } = await runGit(['rev-parse', '--short', 'HEAD']);
    const { stdout: msgOut } = await runGit(['log', '-1', '--pretty=%s']);
    res.json({
      branch,
      ahead,
      behind,
      isDirty: dirty,
      counts: {
        staged: staged.length,
        unstaged: unstaged.length,
        untracked: lines.filter((l) => l.startsWith('? ')).length,
      },
      shortHash: hashOut.trim(),
      lastCommitMsg: msgOut.trim(),
    });
  } catch (e) {
    res
      .status(500)
      .json({ error: 'status_failed', detail: String(e.stderr || e.message) });
  }
});

router.get('/changes', async (_req, res) => {
  try {
    const { stdout } = await runGit(['status', '--porcelain']);
    const staged = [],
      unstaged = [];
    stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const x = line[0];
        const y = line[1];
        const file = line.slice(3);
        if (x !== ' ' && x !== '?') staged.push({ path: file, status: x });
        if (y !== ' ') unstaged.push({ path: file, status: y });
        if (x === '?' && y === '?')
          unstaged.push({ path: file, status: '?' });
      });
    res.json({ staged, unstaged });
  } catch (e) {
    res
      .status(500)
      .json({ error: 'changes_failed', detail: String(e.stderr || e.message) });
  }
});

router.post('/stage', express.json(), async (req, res) => {
  if (READ_ONLY) return readOnly(res);
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  try {
    const safe = files.map(sanitizeFile);
    if (safe.length) await runGit(['add', '--', ...safe]);
    res.json({ ok: true });
  } catch (e) {
    res
      .status(400)
      .json({ error: 'stage_failed', detail: String(e.message || e) });
  }
});

router.post('/unstage', express.json(), async (req, res) => {
  if (READ_ONLY) return readOnly(res);
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  try {
    const safe = files.map(sanitizeFile);
    if (safe.length) await runGit(['reset', '--', ...safe]);
    res.json({ ok: true });
  } catch (e) {
    res
      .status(400)
      .json({ error: 'unstage_failed', detail: String(e.message || e) });
  }
});

router.post('/commit', express.json(), async (req, res) => {
  if (READ_ONLY) return readOnly(res);
  const subject = (req.body?.subject || '').trim();
  const body = (req.body?.body || '').trim();
  if (!subject) return res.status(400).json({ error: 'subject_required' });
  try {
    const args = ['commit', '-m', subject];
    if (body) args.push('-m', body);
    await runGit(args);
    const { stdout } = await runGit(['rev-parse', 'HEAD']);
    res.json({ hash: stdout.trim() });
  } catch (e) {
    res
      .status(500)
      .json({ error: 'commit_failed', detail: String(e.stderr || e.message) });
  }
});

router.get('/diff', async (req, res) => {
  const file = (req.query.path || '').toString();
  const cached = String(req.query.cached || 'false').toLowerCase() === 'true';
  try {
    const safe = sanitizeFile(file);
    const args = ['diff'];
    if (cached) args.push('--cached');
    args.push('--', safe);
    const { stdout } = await runGit(args);
    res.type('text/plain').send(stdout);
  } catch (e) {
    res
      .status(400)
      .json({ error: 'diff_failed', detail: String(e.message || e) });
  }
});

router.get('/history', async (req, res) => {
  const branch = (req.query.branch || 'HEAD').toString();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const skip = parseInt(req.query.skip) || 0;
  if (!/^[A-Za-z0-9._\/\-]+$/.test(branch))
    return res.status(400).json({ error: 'invalid_branch' });
  try {
    const { stdout } = await runGit([
      'log',
      branch,
      '-n',
      String(limit),
      `--skip=${skip}`,
      '--pretty=%H%x01%an%x01%ae%x01%ad%x01%s',
      '--date=iso',
    ]);
    const commits = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, author, email, dateISO, subject] = line.split('\x01');
        return { hash, author, email, dateISO, subject };
      });
    res.json({ commits });
  } catch (e) {
    res
      .status(500)
      .json({ error: 'history_failed', detail: String(e.stderr || e.message) });
  }
});

router.get('/branches', async (_req, res) => {
  try {
    const { stdout: cur } = await runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    const { stdout: locals } = await runGit([
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/heads',
    ]);
    const { stdout: remotes } = await runGit([
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/remotes',
    ]);
    res.json({
      current: cur.trim(),
      locals: locals.trim().split('\n').filter(Boolean),
      remotes: remotes.trim().split('\n').filter(Boolean),
    });
  } catch (e) {
    res
      .status(500)
      .json({ error: 'branches_failed', detail: String(e.stderr || e.message) });
  }
});

module.exports = router;
