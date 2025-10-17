import { Router } from 'express';
import fs from 'fs';
const r = Router(); const MON='data/aiops/monitor.jsonl', ALT='data/aiops/alerts.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/aiops',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/monitor/ingest',(req,res)=>{ append(MON,{ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/monitor/recent',(req,res)=>{ const env=String(req.query.env||''); const items=lines(MON).reverse().filter((x:any)=>!env||x.env===env).slice(0,200); res.json({ items }); });
r.post('/monitor/alert/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const rows=lines(MON).filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period);
  let count=0; for(const r0 of rows){ if((r0.metrics?.error_rate||0)>0.05 || (r0.metrics?.latency_p95||0)>800 || (r0.drift?.psi||0)>0.2 || (r0.fairness?.value||0)<0.7){ append(ALT,{ ts:Date.now(), env:r0.env, period, trigger:'mlo', sample:r0 }); count++; } }
  res.json({ ok:true, count });
});
export default r;
