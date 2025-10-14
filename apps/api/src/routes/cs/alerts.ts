import { Router } from 'express';
import fs from 'fs';
const r = Router(); const H='data/cs/health.jsonl', A='data/cs/alerts.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/cs',{recursive:true}); fs.appendFileSync(A, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/alerts/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const thr=Number(process.env.CS_HEALTH_THRESHOLD||0.6);
  const rows=read(H).filter((x:any)=>x.period===period);
  let count=0;
  for(const r of rows){
    if(Number(r.health||0) < thr){
      append({ ts:Date.now(), accountId:r.accountId, period, type:'health_drop', health:r.health });
      count++;
    }
  }
  res.json({ ok:true, count });
});
r.get('/alerts/recent',(_req,res)=>{ const items=read(A).reverse().slice(0,100); res.json({ items }); });
export default r;
