import { Router } from 'express';
import fs from 'fs';
const r = Router(); const TB='data/cons/tb.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/cons',{recursive:true}); fs.appendFileSync(TB, JSON.stringify(row)+'\n'); };
const filter=(period:string,entityId:string)=> fs.existsSync(TB)? fs.readFileSync(TB,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>(!period||x.period===period)&&(!entityId||x.entityId===entityId)) : [];
r.post('/tb/import',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/tb/snapshot',(req,res)=>{ const { period='', entityId='' } = req.query as any; res.json({ rows: filter(String(period),String(entityId)) }); });

export default r;
