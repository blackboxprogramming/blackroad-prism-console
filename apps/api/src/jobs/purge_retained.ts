import fs from 'fs';
const days = Number(process.env.RETENTION_DAYS || 365);
const cutoff = Date.now() - days*86400000;
for (const f of ['csat.jsonl']) {
  if (!fs.existsSync(f)) continue;
  const out = `${f}.tmp`;
  const r = fs.readFileSync(f,'utf-8').split('\n').filter(Boolean).map(JSON.parse).filter((row:any)=>row.ts >= cutoff);
  fs.writeFileSync(out, r.map(x=>JSON.stringify(x)).join('\n')+'\n');
  fs.renameSync(out, f);
}
console.log(`Purged data older than ${days} days`);
