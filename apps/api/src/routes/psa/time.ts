import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/psa/time.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/psa',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/time/log',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/time/recent',(req,res)=>{ const pid=String(req.query.projectId||''); const items=read().reverse().filter((x:any)=>!pid||x.projectId===pid).slice(0,200); res.json({ items }); });
export default r;
