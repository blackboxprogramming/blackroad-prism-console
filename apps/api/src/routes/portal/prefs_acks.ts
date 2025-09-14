import { Router } from 'express';
import fs from 'fs';
const r = Router(); const PREF='portal/preferences.json', ACK='data/portal/receipts.jsonl';
const pread=()=> fs.existsSync(PREF)? JSON.parse(fs.readFileSync(PREF,'utf-8')):{ prefs:{} };
const pwrite=(o:any)=>{ fs.mkdirSync('portal',{recursive:true}); fs.writeFileSync(PREF, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/portal',{recursive:true}); fs.appendFileSync(ACK, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(ACK)? fs.readFileSync(ACK,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/prefs/set',(req,res)=>{ const o=pread(); const v=req.body||{}; o.prefs[v.subjectId]=Object.assign({channels:{}}, v); pwrite(o); res.json({ ok:true }); });
r.get('/prefs/:subjectId',(req,res)=>{ res.json(pread().prefs[String(req.params.subjectId)]||{channels:{}}); });

r.post('/acks/record',(req,res)=>{ append({ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/acks/status',(req,res)=>{ const type=String(req.query.refType||''), id=String(req.query.refId||''); const count=lines().filter((x:any)=>x.ref?.type===type && x.ref?.id===id).length; res.json({ ref:{type,id}, count }); });

export default r;
