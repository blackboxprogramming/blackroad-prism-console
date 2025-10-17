
import fs from 'fs';
const F='data/dev/webhook_deliveries.jsonl'; if(!fs.existsSync(F)) process.exit(0);
const rows=fs.readFileSync(F,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
let changed=false;
for(const r of rows){ if(r.status==='failed' && (r.attempts||0)<Number(process.env.DEV_WEBHOOK_RETRY||3)){ r.status='queued'; r.attempts=(r.attempts||0)+1; changed=true; } }
if(changed) fs.writeFileSync(F, rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log('webhook redelivery scan complete');
