#!/usr/bin/env node
/**
 * Append a deploy record to sites/blackroad/public/deploys.json (keeps last 25).
 * usage: node deploy-history.js <channel> <sha> [ref]
 */
const fs = require('fs');
const path = require('path');
const channel = process.argv[2] || 'canary';
const sha = process.argv[3] || process.env.GITHUB_SHA || '';
const ref = process.argv[4] || '';
const file = path.join(process.cwd(), 'sites', 'blackroad', 'public', 'deploys.json');
let j = { history: [] };
if (fs.existsSync(file)) {
  j = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch {
  /* ignore errors when file is missing or invalid JSON */
}
} catch {}
}
if (!Array.isArray(j.history)) j.history = [];
j.history.unshift({ ts: new Date().toISOString(), channel, sha, ref });
j.history = j.history.slice(0, 25);
// also compute per-channel heads
j.channels = j.history.reduce((acc, d) => {
  acc[d.channel] = acc[d.channel] || [];
  acc[d.channel].push(d);
  return acc;
}, {});
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(j, null, 2));
console.log('Recorded deploy:', channel, sha.slice(0, 7));
