import { Router } from 'express';
import fs from 'fs';
const r = Router(); const RET='privacy/retention.json', HOL='data/privacy/holds.jsonl';
const read=()=> fs.existsSync(RET)? JSON.parse(fs.readFileSync(RET,'utf-8')):{ schedules:[] };
const write=(o:any)=>{ fs.mkdirSync('privacy',{recursive:true}); fs.writeFileSync(RET, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/privacy',{recursive:true}); fs.appendFileSync(HOL, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(HOL)? fs.readFileSync(HOL,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/retention/set',(req,res)=>{ write({ schedules: req.body?.schedules||[] }); res.json({ ok:true }); });
r.post('/holds/place',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/retention',(_req,res)=> res.json(read()));
r.get('/holds/recent',(_req,res)=> res.json({ items: lines().reverse().slice(0,200) }));
export default r;
