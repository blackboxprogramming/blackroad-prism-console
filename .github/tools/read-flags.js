/* eslint-env node */
/* global process, console */
// Reads .github/feature-flags.yml and prints key=value lines for GITHUB_OUTPUT
import fs from 'node:fs';
import path from 'node:path';
const fp = path.join(process.cwd(), '.github', 'feature-flags.yml');
const out = [];
function parseYAML(s) {
  const o = {};
  s.split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$/);
    if (m) {
      const k = m[1];
      let v = m[2].toLowerCase();
      if (['true', 'false'].includes(v)) o[k] = v === 'true';
      else o[k] = m[2];
    }
  });
  return o;
}
let flags = { ai_tools: true, security_scans: true, heavy_linters: true };
try {
  if (fs.existsSync(fp)) {
    const txt = fs.readFileSync(fp, 'utf8');
    flags = { ...flags, ...parseYAML(txt) };
  }
} catch {
  /* ignore */
}
for (const [k, v] of Object.entries(flags)) {
  out.push(`${k}=${String(v)}`);
}
console.log(out.join('\n'));
