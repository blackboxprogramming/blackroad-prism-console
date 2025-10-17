import { Router } from 'express';
import fs from 'fs';
const r = Router(); const A='data/ats/applications.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/ats',{recursive:true}); fs.appendFileSync(A, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(A)? fs.readFileSync(A,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/applications/create',(req,res)=>{ append({ ts:Date.now(), stage:'Applied', ...req.body }); res.json({ ok:true }); });
r.post('/applications/state',(req,res)=>{ append({ ts:Date.now(), appId:req.body?.appId, stage:req.body?.stage }); res.json({ ok:true }); });
r.get('/applications/recent',(req,res)=>{ const j=String(req.query.jobId||''), c=String(req.query.candidateId||''); const items=lines().reverse().filter((x:any)=>(!j||x.jobId===j)&&(!c||x.candidateId===c)).slice(0,200); res.json({ items }); });
export default r;
