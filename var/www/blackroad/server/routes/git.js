import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();

function sanitizeDiff(diff, filePath) {
  const lines = diff.split('\n');
  let i = lines.findIndex(l => l.startsWith('--- '));
  if (i !== -1) lines[i] = `--- ${filePath}`;
  i = lines.findIndex(l => l.startsWith('+++ '));
  if (i !== -1) lines[i] = `+++ ${filePath}`;
  return lines.join('\n');
}

async function applyPatch(patch) {
  const { path: filePath, diff } = patch || {};
  if (typeof filePath !== 'string' || typeof diff !== 'string') {
    throw new Error('invalid patch format');
  }
  const absPath = path.resolve(repoRoot, filePath);
  if (!absPath.startsWith(repoRoot + path.sep)) {
    throw new Error('invalid path');
  }
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  const sanitized = sanitizeDiff(diff, filePath);
  await new Promise((resolve, reject) => {
    const child = spawn('patch', ['-p0', '--silent'], {
      cwd: repoRoot,
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let err = '';
    child.stderr.on('data', d => (err += d));
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `patch exited ${code}`));
    });
    child.stdin.end(sanitized);
  });
  return 'ok';
}

export async function applyPatches(req, res) {
  const { patches } = req.body || {};
  if (!Array.isArray(patches)) {
    return res.status(400).json({ error: 'patches[] required' });
  }
  const applied = {};
  for (const p of patches) {
    try {
      applied[p.path] = await applyPatch(p);
    } catch (err) {
      applied[p.path] = String(err.message || err);
    }
  }
  res.json({ applied });
}

