import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='revrec/schedules.jsonl', J='revrec/journal.jsonl';
const read=(f:string)=> fs.existsSync(f)? fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/journal/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const schedules=read(S);
  const rows=[] as any[];
  for(const s of schedules){
    const hit=(s.schedule||[]).find((x:any)=>x.period===period); if(hit && hit.amount){
      rows.push({ ts:Date.now(), period, contractId:s.contractId, je:[{account:'Deferred Revenue',dr:0,cr:hit.amount},{account:'Revenue',dr:hit.amount,cr:0}] });
    }
  }
  rows.forEach(rw=>fs.appendFileSync(J, JSON.stringify(rw)+'\n'));
  res.json({ ok:true, count: rows.length });
});
r.get('/journal/recent',(req,res)=>{
  const p=String(req.query.period||''); const items=read(J).reverse().filter((x:any)=>!p||x.period===p).slice(0,200); res.json({ items });
});
export default r;
