import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const D='data/sox/deficiencies.jsonl', R='data/sox/remediation.jsonl';
const append=(f:string,row:any)=>{ fs.mkdirSync('data/sox',{recursive:true}); fs.appendFileSync(f, JSON.stringify(row)+'\n'); };

r.post('/deficiency/log',(req,res)=>{
  const id=uuid(); append(D,{ id, ts:Date.now(), ...req.body }); res.json({ ok:true, deficiencyId:id });
});
r.post('/deficiency/remediation',(req,res)=>{
  append(R,{ ts:Date.now(), ...req.body }); res.json({ ok:true });
});
r.get('/deficiency/recent',(req,res)=>{
  const sev=String(req.query.severity||''); const rows=fs.existsSync(D)?fs.readFileSync(D,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
  const items=rows.reverse().filter((x:any)=>!sev||x.severity===sev).slice(0,200); res.json({ items });
});
export default r;
