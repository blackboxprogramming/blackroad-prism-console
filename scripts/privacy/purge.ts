import fs from 'fs';
import yaml from 'yaml';

const policies = yaml.parse(fs.readFileSync('privacy/retention/policies.yaml','utf-8')).policies || {};
const now = Date.now();

function purgeJsonl(file:string, maxDays:number, timeKey='ts'){
  if (!fs.existsSync(file)) return;
  const cutoff = now - maxDays*86400000;
  const out = fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>Number(x[timeKey]||0)>=cutoff);
  fs.writeFileSync(file, out.map(x=>JSON.stringify(x)).join('\n')+'\n');
}

if (policies['consent_events']) purgeJsonl('data/privacy/consent.jsonl', policies['consent_events']);
if (policies['dsar_queue']) purgeJsonl('data/privacy/dsar_queue.jsonl', policies['dsar_queue']);
console.log('privacy-purge-complete');
