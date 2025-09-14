import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CNT='data/inv/counts.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/inv',{recursive:true}); fs.appendFileSync(CNT, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(CNT)? fs.readFileSync(CNT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/count/start',(req,res)=>{ append({ ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true }); });
r.post('/count/submit',(req,res)=>{ append({ ts:Date.now(), state:'submitted', ...req.body }); res.json({ ok:true }); });
r.post('/count/adjust',(req,res)=>{ append({ ts:Date.now(), state:'adjusted', ...req.body }); res.json({ ok:true }); });
r.get('/count/:countId',(req,res)=>{ const items=list().filter((x:any)=>x.countId===String(req.params.countId)); res.json({ items }); });
export default r;
