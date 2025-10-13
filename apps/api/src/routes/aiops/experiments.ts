import { Router } from 'express';
import fs from 'fs';
const r = Router(); const EXP='data/aiops/experiments.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/aiops',{recursive:true}); fs.appendFileSync(EXP, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(EXP)? fs.readFileSync(EXP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const read=()=> fs.existsSync(EXP)? fs.readFileSync(EXP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/experiments/create',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/experiments/log',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/experiments/recent',(req,res)=>{ const m=String(req.query.model||''); const items=read().reverse().filter((x:any)=>!m||x.model===m||x.expId?.startsWith(m)).slice(0,200); res.json({ items }); });
export default r;
