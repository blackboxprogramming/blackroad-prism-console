/* eslint-env node */
/* eslint-disable no-undef */
/**
 * Bot School Runner — now merges ALL lesson files under .github/prompts/*.yaml
 * into one pool and executes selected ones.
 *
 * Env:
 *  - BOT_TOKEN (optional push)
 *  - LESSON_IDS="id1,id2,..." to pin exact lessons
 *  - LESSON_COUNT=3     how many to pick at random if no IDs (max 10)
 *  - DEFAULT_BRANCH     fallback: main
 *  - DRY_RUN=1          preview only (no commit/push/PR)
 */
import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';

function sh(cmd, opts = {}) {
  return cp.execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
}
function has(p) {
  return fs.existsSync(p);
}

function parseYamlLessons(s) {
  // Minimal YAML parser for our simple structure
  const out = [];
  let cur = null,
    mode = null,
    list = null,
    inBlock = false,
    blockKey = '',
    blockBuf = [];
  const lines = s.replace(/\r/g, '').split('\n');
  const finishBlock = () => {
    if (inBlock) {
      cur[blockKey] = blockBuf.join('\n');
      inBlock = false;
      blockBuf = [];
    }
  };
  for (const raw of lines) {
    const l = raw;
    if (/^\s*#/.test(l)) continue;
    if (/^\s*$/.test(l)) {
      if (inBlock) blockBuf.push('');
      continue;
    }
    if (inBlock) {
      if (/^ {4}\S/.test(l) || /^ {6}/.test(l)) {
        blockBuf.push(l.replace(/^ {4}/, ''));
        continue;
      } else {
        finishBlock();
      }
    }
    if (/^\s*lessons:\s*$/.test(l)) {
      mode = 'lessons';
      continue;
    }
    if (mode !== 'lessons') continue;
    let m;
    if ((m = l.match(/^\s*-\s+id:\s*(.+)$/))) {
      if (cur) out.push(cur);
      cur = { id: m[1].trim(), actions: [], acceptance: [] };
      continue;
    }
    if (!cur) continue;
    if ((m = l.match(/^\s+title:\s*(.+)$/))) cur.title = m[1].trim();
    else if ((m = l.match(/^\s+goal:\s*(.+)$/))) cur.goal = m[1].trim();
    else if (/^\s+instructions:\s*\|/.test(l)) {
      inBlock = true;
      blockKey = 'instructions';
      blockBuf = [];
    } else if (/^\s+acceptance:\s*$/.test(l)) {
      list = 'acceptance';
    } else if (list === 'acceptance' && (m = l.match(/^\s+-\s+(.+)$/)))
      cur.acceptance.push(m[1].trim());
    else if (/^\s+actions:\s*$/.test(l)) {
      list = 'actions';
    } else if (list === 'actions') {
      if ((m = l.match(/^\s+-\s+run:\s+"?(.+?)"?\s*$/)))
        cur.actions.push({ kind: 'run', cmd: m[1] });
      else if ((m = l.match(/^\s+-\s+ensure:\s+"?(.+?)"?\s*$/)))
        cur.actions.push({ kind: 'ensure', path: m[1] });
      else if ((m = l.match(/^\s+-\s+edit:\s+"?(.+?)"?\s*$/)))
        cur.actions.push({ kind: 'edit', path: m[1] });
      else if (/^\s+-\s+node:\s*\|/.test(l)) {
        inBlock = true;
        blockKey = 'node';
        blockBuf = [];
        cur.actions.push({ kind: 'node', body: null, _capture: true });
      } else if (cur.actions.length && cur.actions[cur.actions.length - 1]._capture && !inBlock) {
        cur.actions[cur.actions.length - 1].body = blockBuf.join('\n');
        delete cur.actions[cur.actions.length - 1]._capture;
      }
    }
  }
  if (cur) out.push(cur);
  return out;
}

function ensurePath(p) {
  const dir = p.endsWith('/') ? p : path.dirname(p);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
  if (!has(p)) fs.writeFileSync(p, '', 'utf8');
}

function applyLesson(lesson) {
  for (const a of lesson.actions) {
    try {
      if (a.kind === 'ensure') {
        ensurePath(a.path);
        sh(`git add ${JSON.stringify(a.path)}`);
      } else if (a.kind === 'edit') {
        ensurePath(a.path);
        if (!has(a.path)) fs.writeFileSync(a.path, `# ${lesson.title}\n`);
        sh(`git add ${JSON.stringify(a.path)}`);
      } else if (a.kind === 'run') {
        sh(a.cmd, { shell: '/bin/bash' });
      } else if (a.kind === 'node') {
        const tmp = '.bot-school-node.js';
        fs.writeFileSync(tmp, a.body || '');
        sh(`node ${tmp}`, { shell: '/bin/bash' });
        fs.rmSync(tmp, { force: true });
      }
    } catch {
      /* skip-safe */
    }
  }
}

function main() {
  const dir = '.github/prompts';
  if (!has(dir)) {
    console.log('No .github/prompts directory; skipping.');
    return;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  let pool = [];
  for (const f of files) {
    try {
      pool.push(...parseYamlLessons(fs.readFileSync(path.join(dir, f), 'utf8')));
    } catch {
      /* empty */
    }
  }
  if (!pool.length) {
    console.log('No lessons found.');
    return;
  }

  const pin = (process.env.LESSON_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  let pick = [];
  if (pin.length) {
    pick = pool.filter((x) => pin.includes(x.id));
  } else {
    const n = Math.max(1, Math.min(parseInt(process.env.LESSON_COUNT || '3', 10) || 3, 10));
    pick = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  }

  const base = sh('git rev-parse --abbrev-ref HEAD || echo main').trim() || 'main';
  const br = `chore/bot-school/${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  if (!process.env.DRY_RUN) {
    try {
      sh(`git checkout -b ${br}`);
    } catch {
      sh(`git checkout -B ${br}`);
    }
  }

  let body = `# 🤖 Bot School PR\nThis PR contains automated lessons:\n`;
  for (const l of pick) {
    body += `\n## ${l.id} — ${l.title}\n**Goal:** ${l.goal}\n\n**DoD:**\n${l.acceptance.map((a) => `- [ ] ${a}`).join('\n')}\n`;
    if (!process.env.DRY_RUN) applyLesson(l);
  }

  if (process.env.DRY_RUN) {
    console.log(body);
    return;
  }

  try {
    sh('git add -A');
    sh('git commit -m "chore(bot-school): apply practice lessons"');
  } catch {
    /* empty */
  }
  const tok = process.env.BOT_TOKEN || '';
  if (tok) {
    const repo = process.env.GITHUB_REPOSITORY;
    try {
      sh(`git push https://${tok}@github.com/${repo}.git HEAD:${br}`);
    } catch {
      /* empty */
    }
  }
  try {
    sh(
      `gh pr create --title "chore(bot-school): ${pick.length} lesson(s)" --body ${JSON.stringify(body)} --base ${base}`,
      { stdio: 'inherit' }
    );
  } catch {
    /* empty */
  }
  console.log(`Created branch ${br} with ${pick.length} lesson(s).`);
}
main();
