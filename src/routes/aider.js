/* FILE: /var/www/blackroad/src/routes/aider.js */
import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const router = express.Router();
router.use(cors());
router.use(express.json({ limit: '1mb' }));

const REPO_ROOT = process.env.REPO_ROOT || '/var/www/blackroad';
const AIDER_BIN = process.env.AIDER_BIN || 'aider'; // or absolute path if needed

function resolveSafe(p) {
  const abs = path.resolve(REPO_ROOT, p);
  if (!abs.startsWith(path.resolve(REPO_ROOT) + path.sep) && abs !== path.resolve(REPO_ROOT)) {
    throw new Error(`Illegal path: ${p}`);
  }
  return abs;
}

function run(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { ...options });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

router.post('/', async (req, res) => {
  try {
    const { message, files = [], model, mode } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ status: 'error', error: 'message is required' });
    }

    // sanitize files
    const safeFiles = [];
    for (const f of files) {
      const abs = resolveSafe(f);
      if (!fs.existsSync(abs)) {
        return res.status(400).json({ status: 'error', error: `file not found: ${f}` });
      }
      // store relative path for aider CLI
      safeFiles.push(path.relative(REPO_ROOT, abs));
    }

    // Build aider args
    const args = ['--yes', '--auto-commits', '--dirty-commits', '--message', message];
    if (model) args.push('--model', model);
    if (mode === 'ask') args.push('--chat-mode', 'ask'); // no edits/commits
    args.push(...safeFiles);

    // Run aider
    const env = { ...process.env };
    const aiderRes = await run(AIDER_BIN, args, { cwd: REPO_ROOT, env });

    // If code mode, gather latest commit info (may be absent if nothing changed)
    let commit = null, diff = null;
    if (mode !== 'ask') {
      const log = await run('git', ['log', '-1', '--pretty=%H%n%s'], { cwd: REPO_ROOT });
      if (log.code === 0 && log.stdout.trim()) {
        const [hash, title] = log.stdout.split('\n');
        commit = { hash: (hash || '').trim(), title: (title || '').trim() };
        const d = await run('git', ['diff', '--name-status', 'HEAD~1..HEAD'], { cwd: REPO_ROOT });
        if (d.code === 0) diff = d.stdout;
      }
    }

    return res.json({
      status: aiderRes.code === 0 ? 'ok' : 'error',
      code: aiderRes.code,
      console: (aiderRes.stdout + '\n' + aiderRes.stderr).trim(),
      commit,
      diff
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: String(err?.message || err) });
  }
});

export default router;
