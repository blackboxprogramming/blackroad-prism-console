import { Router } from 'express';
import fs from 'fs';
const r = Router(); const TRAIN='data/aiops/training.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/aiops',{recursive:true}); fs.appendFileSync(TRAIN, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(TRAIN)? fs.readFileSync(TRAIN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const read=()=> fs.existsSync(TRAIN)? fs.readFileSync(TRAIN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/training/run',(req,res)=>{ append({ ts:Date.now(), status:'running', ...req.body }); res.json({ ok:true }); });
r.get('/training/status/:runId',(req,res)=>{ const it=read().reverse().find((x:any)=>x.runId===String(req.params.runId)); res.json(it||{}); });
export default r;
