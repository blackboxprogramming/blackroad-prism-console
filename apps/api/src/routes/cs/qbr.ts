import { Router } from 'express';
import fs from 'fs';
const r = Router(); const Q='data/cs/qbr.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/cs',{recursive:true}); fs.appendFileSync(Q, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/qbr/log',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/qbr/recent',(req,res)=>{ const id=String(req.query.accountId||''); const items=read().reverse().filter((x:any)=>!id||x.accountId===id).slice(0,50); res.json({ items }); });
export default r;
