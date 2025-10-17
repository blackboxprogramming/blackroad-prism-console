import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CS='data/support/csat.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(CS, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(CS)? fs.readFileSync(CS,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const lines=()=> fs.existsSync(CS)? fs.readFileSync(CS,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/csat/record',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/csat/recent',(_req,res)=>{ res.json({ items: lines().reverse().slice(0,200) }); });
export default r;
