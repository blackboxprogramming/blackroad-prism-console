import fs from 'fs';
import fetch from 'node-fetch';
const FILE='data/mkt/campaigns.jsonl';
if (!fs.existsSync(FILE)) process.exit(0);
const rows = fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
for (const c of rows) {
  if (c.state!=='scheduled' && c.state!=='running') continue;
  // stub send: post to notify endpoint if available
  if (process.env.SLACK_WEBHOOK) await fetch(process.env.SLACK_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({text:`Campaign ${c.name} tick`})}).catch(()=>null);
}
console.log('Campaign run tick complete.');
