import { Router } from 'express';
import fs from 'fs';
const r = Router(); const PLAN='data/patch/plans.jsonl', EXEC='data/patch/exec.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/patch',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const list=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/plan/create',(req,res)=>{ append(PLAN,{ ts:Date.now(), state:'planned', ...req.body }); res.json({ ok:true }); });
r.post('/plan/execute',(req,res)=>{ const it=list(PLAN).find((x:any)=>x.planId===req.body?.planId); if(!it) return res.status(404).json({error:'not_found'}); append(EXEC,{ ts:Date.now(), planId: req.body?.planId, result:'executed' }); res.json({ ok:true }); });
r.get('/plan/:planId',(req,res)=>{ const it=list(PLAN).find((x:any)=>x.planId===String(req.params.planId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
