const { spawn, execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

function getRepoRoot() {
  const root = process.env.GIT_REPO_ROOT
    ? path.resolve(process.env.GIT_REPO_ROOT)
    : process.cwd();
  return root;
}

function ensureRepoPath(filePath) {
  const repoRoot = getRepoRoot();
  const abs = path.resolve(repoRoot, filePath);
  if (abs !== repoRoot && !abs.startsWith(repoRoot + path.sep)) {
    throw new Error('invalid path');
  }
  return { abs, repoRoot };
}

function sanitizeDiff(diff, filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const lines = diff.split('\n');
  const replacements = [
    { prefix: '--- ', value: `--- ${normalized}` },
    { prefix: '+++ ', value: `+++ ${normalized}` },
    { prefix: 'diff --git ', value: `diff --git a/${normalized} b/${normalized}` },
  ];
  for (const { prefix, value } of replacements) {
    const idx = lines.findIndex((line) => line.startsWith(prefix));
    if (idx !== -1) lines[idx] = value;
  }
  return lines.join('\n');
}

async function runGit(args, { trim = true } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      { cwd: getRepoRoot(), maxBuffer: 2 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const message = stderr?.toString().trim() || error.message;
          const err = new Error(message);
          err.code = error.code;
          return reject(err);
        }
        resolve(trim ? stdout.toString().trim() : stdout.toString());
      },
    );
  });
}

function parseBranchStatus(line) {
  if (!line) {
    return { branch: 'HEAD', upstream: null, ahead: 0, behind: 0, detached: false };
  }
  const cleaned = line.replace(/^##\s*/, '');
  if (cleaned.includes('no branch')) {
    return { branch: 'detached', upstream: null, ahead: 0, behind: 0, detached: true };
  }
  const [branchPart, rest] = cleaned.split('...');
  const info = {
    branch: branchPart || 'HEAD',
    upstream: null,
    ahead: 0,
    behind: 0,
    detached: false,
  };
  if (rest) {
    const upstreamMatch = rest.match(/^([^\s]+)(?:\s+\[(.*)\])?/);
    if (upstreamMatch) {
      info.upstream = upstreamMatch[1];
      const details = upstreamMatch[2] || '';
      const aheadMatch = details.match(/ahead\s+(\d+)/);
      const behindMatch = details.match(/behind\s+(\d+)/);
      if (aheadMatch) info.ahead = Number.parseInt(aheadMatch[1], 10);
      if (behindMatch) info.behind = Number.parseInt(behindMatch[1], 10);
    }
  }
  return info;
}

function parseChanges(output) {
  const staged = [];
  const unstaged = [];
  if (!output) return { staged, unstaged };
  const lines = output.split('\n').filter(Boolean);
  for (const line of lines) {
    if (line.length < 4) continue;
    const status = line.slice(0, 2);
    const rawPath = line.slice(3).trim();
    const parts = rawPath.split(' -> ');
    const file = parts[parts.length - 1];
    if (status === '??') {
      unstaged.push({ path: file, status: '?' });
      continue;
    }
    if (status[0] && status[0] !== ' ') {
      staged.push({ path: file, status: status[0] });
    }
    if (status[1] && status[1] !== ' ') {
      unstaged.push({ path: file, status: status[1] });
    }
  }
  return { staged, unstaged };
}

function validatePaths(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('files[] required');
  }
  const repoRoot = getRepoRoot();
  return files.map((file) => {
    if (typeof file !== 'string' || !file.trim()) {
      throw new Error('file paths must be non-empty strings');
    }
    const abs = path.resolve(repoRoot, file);
    if (abs !== repoRoot && !abs.startsWith(repoRoot + path.sep)) {
      throw new Error(`invalid path: ${file}`);
    }
    return path.relative(repoRoot, abs).replace(/\\/g, '/');
  });
}

async function applyPatch(patch) {
  const { path: filePath, diff } = patch || {};
  if (typeof filePath !== 'string' || typeof diff !== 'string') {
    throw new Error('invalid patch format');
  }
  const { abs, repoRoot } = ensureRepoPath(filePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const relativePath = path.relative(repoRoot, abs).replace(/\\/g, '/');
  const sanitized = sanitizeDiff(diff, relativePath);
  await new Promise((resolve, reject) => {
    const child = spawn('patch', ['-p0', '--silent'], {
      cwd: repoRoot,
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `patch exited ${code}`));
    });
    child.stdin.end(sanitized);
  });
  return 'ok';
}

async function applyPatches(patches) {
  if (!Array.isArray(patches)) {
    throw new Error('patches[] required');
  }
  const applied = {};
  for (const patch of patches) {
    try {
      applied[patch.path] = await applyPatch(patch);
    } catch (err) {
      applied[patch.path] = String(err.message || err);
    }
  }
  return { applied };
}

async function gitHealth() {
  try {
    const [version, insideWorkTree] = await Promise.all([
      runGit(['--version']),
      runGit(['rev-parse', '--is-inside-work-tree']),
    ]);
    return { ok: true, version, insideWorkTree: insideWorkTree === 'true' };
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
}

async function gitStatus() {
  try {
    const output = await runGit(['status', '--short', '--branch']);
    const [branchLine] = output.split('\n');
    return parseBranchStatus(branchLine);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
}

async function gitChanges() {
  try {
    const output = await runGit(['status', '--porcelain']);
    return parseChanges(output);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
}

async function gitStage(files) {
  const normalized = validatePaths(files);
  await runGit(['add', '--', ...normalized]);
  return { staged: normalized.length };
}

async function gitUnstage(files) {
  const normalized = validatePaths(files);
  await runGit(['restore', '--staged', '--', ...normalized]);
  return { unstaged: normalized.length };
}

async function gitCommit({ subject, body } = {}) {
  if (typeof subject !== 'string' || !subject.trim()) {
    throw new Error('subject required');
  }
  const args = ['commit', '-m', subject.trim()];
  if (typeof body === 'string' && body.trim()) {
    args.push('-m', body.trim());
  }
  await runGit(args);
  const latest = await runGit(['log', '-1', '--pretty=format:%H%x09%an%x09%ad%x09%s', '--date=iso']);
  const [hash, author, date, message] = latest.split('\t');
  return { ok: true, commit: { hash, author, date, subject: message } };
}

async function gitHistory({ limit } = {}) {
  try {
    const parsedLimit = Number.isFinite(limit) ? limit : Number.parseInt(limit, 10);
    const clamped = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;
    const output = await runGit([
      'log',
      '-n',
      String(clamped),
      '--pretty=format:%H%x09%an%x09%ad%x09%s',
      '--date=iso',
    ]);
    const history = output
      ? output.split('\n').filter(Boolean).map((line) => {
          const [hash, author, date, subject] = line.split('\t');
          return { hash, author, date, subject };
        })
      : [];
    return { history };
  } catch (err) {
    if (/does not have any commits/.test(err.message)) {
      return { history: [] };
    }
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
}

module.exports = {
  getRepoRoot,
  ensureRepoPath,
  sanitizeDiff,
  runGit,
  parseBranchStatus,
  parseChanges,
  validatePaths,
  applyPatch,
  applyPatches,
  gitHealth,
  gitStatus,
  gitChanges,
  gitStage,
  gitUnstage,
  gitCommit,
  gitHistory,
};
