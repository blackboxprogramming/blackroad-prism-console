import { Router } from 'express';
import fs from 'fs';
const r = Router(); const Q='data/elt/quality.jsonl', C='data/elt/costs.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/elt',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
r.post('/quality/evaluate',(req,res)=>{ append(Q,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/costs/ingest',(req,res)=>{ append(C,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/costs/summary',(req,res)=>{ const p=String(req.query.period||''); const rows=lines(C).filter((x:any)=>x.period===p); const compute=rows.reduce((s:any,r:any)=>s+Number(r.compute_cost||0),0); const storage=rows.reduce((s:any,r:any)=>s+Number(r.storage_cost||0),0); res.json({ period:p, compute, storage, total: compute+storage }); });
export default r;
