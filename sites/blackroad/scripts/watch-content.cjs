#!/usr/bin/env node
/**
 * Watch docs/blog content and rebuild on change.
 */
const { spawn } = require('child_process');
const path = require('path');
const chokidar = require('chokidar');

const ROOT = path.join(process.cwd(), 'sites', 'blackroad');
const DOCS = path.join(ROOT, 'content', 'docs');
const BLOG = path.join(ROOT, 'content', 'blog');

function rebuild() {
  spawn(process.execPath, [path.join(ROOT, 'scripts', 'build-docs.cjs')], {
    stdio: 'inherit'
  });
  spawn(process.execPath, [path.join(ROOT, 'scripts', 'build-blog.cjs')], {
    stdio: 'inherit'
  });
}

chokidar.watch([DOCS, BLOG].filter(Boolean), { ignoreInitial: true }).on('all', (event, filePath) => {
  if (/\.md$/i.test(filePath)) {
    rebuild();
  }
});

console.log('Watching docs and blog content for changes...');
rebuild();
