import fs from 'fs';
const ACT='data/esg/activity.jsonl', OUT='data/esg/emissions.jsonl';
if (!fs.existsSync(ACT)) process.exit(0);
const rows=fs.readFileSync(ACT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const periods=[...new Set(rows.map(r=>r.period))];
for(const p of periods){
  const f=(t:string)=>rows.filter(r=>r.period===p && r.scope===t).reduce((s:number,r:any)=>s+r.amount*0.001,0);
  const snap={ ts:Date.now(), period:p, scope1:f('S1'), scope2:f('S2'), scope3:f('S3'), total: f('S1')+f('S2')+f('S3') };
  fs.appendFileSync(OUT, JSON.stringify(snap)+'\n');
}
console.log('carbon recalculated');
