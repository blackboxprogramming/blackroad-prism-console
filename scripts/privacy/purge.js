const fs = require('fs');
const yaml = require('yaml');

const policiesDoc = fs.existsSync('privacy/retention/policies.yaml')
  ? yaml.parse(fs.readFileSync('privacy/retention/policies.yaml','utf-8'))
  : {};
const policies = policiesDoc.policies || {};
const now = Date.now();

function purgeJsonl(file, maxDays, timeKey = 'ts'){
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file,'utf-8').trim();
  if (!raw) { fs.writeFileSync(file,''); return; }
  const cutoff = now - maxDays*86400000;
  const out = raw.split('\n')
    .filter(Boolean)
    .map((l)=>JSON.parse(l))
    .filter((x)=>Number((x && x[timeKey]) || 0) >= cutoff);
  const serialized = out.map((x)=>JSON.stringify(x)).join('\n');
  fs.writeFileSync(file, serialized ? `${serialized}\n` : '');
}

if (policies['consent_events']) purgeJsonl('data/privacy/consent.jsonl', policies['consent_events']);
if (policies['dsar_queue']) purgeJsonl('data/privacy/dsar_queue.jsonl', policies['dsar_queue']);
console.log('privacy-purge-complete');
