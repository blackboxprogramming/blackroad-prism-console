import fs from 'fs';
const FILE='data/iam/tokens.jsonl';
if(!fs.existsSync(FILE)) process.exit(0);
const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const now=Date.now();
const kept=rows.filter((r:any)=>r.exp>now);
fs.writeFileSync(FILE, kept.map(r=>JSON.stringify(r)).join('\n')+(kept.length?'\n':''));
console.log('expired tokens pruned');
