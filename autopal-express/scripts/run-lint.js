#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function collectJsFiles(baseDir) {
  const results = [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }
    const resolved = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(resolved));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(resolved);
    }
  }
  return results;
}

function run() {
  const projectRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcDir)) {
    console.log('No src directory detected; skipping lint step.');
    return;
  }
  const files = collectJsFiles(srcDir);
  let failures = 0;
  for (const file of files) {
    try {
      execSync(`node --check "${file}"`, { stdio: 'pipe' });
    } catch (error) {
      failures += 1;
      console.error(`Syntax error detected in ${path.relative(projectRoot, file)}`);
      console.error(error.stdout?.toString() || error.message);
      console.error(error.stderr?.toString() || '');
    }
  }
  if (failures > 0) {
    console.error(`Lint failed: ${failures} file(s) contain syntax errors.`);
    process.exit(1);
  }
  console.log(`Lint successful: ${files.length} file(s) validated with node --check.`);
}

run();
