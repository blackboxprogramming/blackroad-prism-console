import { Router } from 'express';
import fs from 'fs';
const r = Router(); const O='data/esg/offsets.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(O, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(O)? fs.readFileSync(O,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
r.post('/offsets/record',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/offsets/recent',(_req,res)=>{ res.json({ items: lines().reverse().slice(0,200) }); });
export default r;
