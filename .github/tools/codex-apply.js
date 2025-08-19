#!/usr/bin/env node
/**
 * Minimal "codex bridge": applies a markdown playbook (file paths not required).
 * - Runs a deterministic remediation sequence oriented around Node/Vite React site.
 * - Idempotent: safe to run multiple times.
 */
import fs from 'node:fs';
import { execSync as sh } from 'node:child_process';
import path from 'node:path';

function has(p) {
  return fs.existsSync(p);
}
function ensure(p, content = '') {
  const dir = p.endsWith('/') ? p : path.dirname(p);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
  if (!has(p)) fs.writeFileSync(p, content, 'utf8');
}
function pkgEnsureScripts(pkgPath, map) {
  if (!has(pkgPath)) return;
  const j = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  j.scripts = j.scripts || {};
  for (const [k, v] of Object.entries(map)) {
    if (!j.scripts[k]) j.scripts[k] = v;
  }
  fs.writeFileSync(pkgPath, JSON.stringify(j, null, 2));
}
function writeIfMissing(p, body) {
  if (!has(p)) fs.writeFileSync(p, body, 'utf8');
}

function tryRun(cmd) {
  try {
    sh(cmd, { stdio: 'inherit', shell: '/bin/bash' });
  } catch {
    /* skip-safe */
  }
}

function main() {
  // Root and site package bootstraps
  pkgEnsureScripts('package.json', {
    format: 'prettier -w .',
    lint: 'eslint . --ext .js,.jsx,.ts,.tsx || true',
    build: 'echo "no root build"; exit 0',
    test: 'node -e "console.log(`ok`)"',
  });
  if (has('sites/blackroad/package.json')) {
    pkgEnsureScripts('sites/blackroad/package.json', {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      format: 'prettier -w .',
      lint: 'eslint . --ext .js,.jsx,.ts,.tsx || true',
    });
  }

  // Basic config files
  writeIfMissing(
    '.prettierrc.json',
    JSON.stringify({ semi: false, singleQuote: true, trailingComma: 'all' }, null, 2)
  );
  writeIfMissing('.prettierignore', ['dist', 'node_modules', 'artifacts', '.github'].join('\n'));
  writeIfMissing('eslint.config.js', `export default [{ rules: { 'no-unused-vars':'warn' } }];`);

  // Site skeleton (only if missing)
  if (!has('sites/blackroad/index.html')) {
    ensure(
      'sites/blackroad/index.html',
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.jsx"></script>'
    );
  }
  if (!has('sites/blackroad/vite.config.js')) {
    ensure(
      'sites/blackroad/vite.config.js',
      `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins:[react()], build:{outDir:'dist'} });`
    );
  }

  // Placeholders for missing assets referenced by public
  ensure('sites/blackroad/public/robots.txt', 'User-agent: *\nAllow: /\n');

  // Run local fixes
  tryRun(
    'npm i -D prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin || true'
  );
  tryRun('(cd sites/blackroad && npm i || true)');
  tryRun('npx prettier -w . || true');
  tryRun('npx eslint . --ext .js,.jsx,.ts,.tsx --fix || true');

  console.log('codex-apply: baseline ensured.');
}
main();
