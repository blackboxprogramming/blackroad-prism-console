#!/usr/bin/env node
// Minimal axe check using playwright-less jsdom (advisory)
import fs from 'fs';
import path from 'path';
const outDir = 'artifacts';
fs.mkdirSync(outDir, { recursive: true });
const dist = 'sites/blackroad/dist/index.html';
if (!fs.existsSync(dist)) {
  console.log('No built HTML; skipping axe.');
  process.exit(0);
}
const html = fs.readFileSync(dist, 'utf8');
const issues = [];
// naive checks:
if (!/lang="en"/i.test(html)) issues.push({ id: 'html-lang', msg: '<html> should specify lang' });
if (!/<meta name="viewport"/i.test(html))
  issues.push({ id: 'meta-viewport', msg: 'missing responsive viewport meta' });
fs.writeFileSync(path.join(outDir, 'axe-report.json'), JSON.stringify({ issues }, null, 2));
console.log(`Axe (naive) issues: ${issues.length}`);
