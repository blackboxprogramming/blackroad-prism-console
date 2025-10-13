import { Router } from 'express';
import fs from 'fs';
const r = Router(); const L='data/ar/lockbox.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/ar',{recursive:true}); fs.appendFileSync(L, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(L)?fs.readFileSync(L,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/lockbox/ingest',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/lockbox/recent',(_req,res)=>{ res.json({ items: read().reverse().slice(0,200) }); });
export default r;
