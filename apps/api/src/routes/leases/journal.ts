import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='leases/schedules.jsonl', J='leases/journal.jsonl';
const append=(row:any)=>{ fs.mkdirSync('leases',{recursive:true}); fs.appendFileSync(J, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/journal/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const sch=read(S);
  let count=0;
  for(const s of sch){
    const row=(s.rows||[]).find((x:any)=>x.period===period); if(!row) continue;
    // Dr Lease Expense/Interest, Cr Cash (simplified); recognize ROU amortization (finance lease variant simplified)
    append({ ts:Date.now(), period, leaseId:s.leaseId, je:[
      {account:process.env.LEASES_GL_ROU||'1600',dr:0,cr: row.principal},
      {account:process.env.LEASES_GL_LIAB||'2100',dr: row.principal,cr:0},
      {account:'Lease Interest Exp',dr: row.interest,cr:0},
      {account:'Cash',dr:0,cr: row.cash}
    ]});
    count++;
  }
  res.json({ ok:true, count });
});
r.get('/journal/recent',(req,res)=>{ const p=String(req.query.period||''); const items=read(J).reverse().filter((x:any)=>!p||x.period===p).slice(0,200); res.json({ items }); });
export default r;
