import { Router } from 'express';
import fs from 'fs';
const r = Router(); const ACT='data/cpm/actuals.jsonl', VAR='data/cpm/variance.jsonl';
function append(file:string,row:any){ fs.mkdirSync('data/cpm',{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n'); }

r.post('/actuals/ingest',(req,res)=>{ append(ACT,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });

r.get('/variance',(req,res)=>{
  const period=String(req.query.period||'');
  const read=(f:string)=> fs.existsSync(f)?fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
  const a=read(ACT).filter((x:any)=>!period||x.period===period).slice(-1)[0]||{kpis:{}};
  const v={ ts:Date.now(), period: period||a.period||'', variance: a.kpis||{} }; // stub
  append(VAR,v); res.json(v);
});

export default r;
