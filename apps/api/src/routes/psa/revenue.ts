import { Router } from 'express';
import fs from 'fs';
const r = Router(); const REV='data/psa/revenue.jsonl', BILL='data/psa/billing.jsonl';
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const append=(row:any)=>{ fs.mkdirSync('data/psa',{recursive:true}); fs.appendFileSync(REV, JSON.stringify(row)+'\n'); };

r.post('/rev/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const bill=read(BILL).filter((b:any)=>String((b.thru||'')).slice(0,7)===period);
  const total=bill.reduce((s:number,b:any)=>s+Number(b.amount||0),0);
  const row={ ts:Date.now(), period, revenue: Number(total.toFixed(2)) };
  append(row); res.json({ ok:true, snapshot: row });
});
r.get('/rev/recent',(req,res)=>{
  const p=String(req.query.period||''); const items=read(REV).reverse().filter((x:any)=>!p||x.period===p).slice(0,12);
  res.json({ items });
});
export default r;
