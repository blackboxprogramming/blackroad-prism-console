import { Router } from 'express';
import fs from 'fs';
const r = Router(); const REG='privacy/consents.json', LOG='data/privacy/consents.jsonl';
const read=()=> fs.existsSync(REG)? JSON.parse(fs.readFileSync(REG,'utf-8')):{ consents:{} };
const write=(o:any)=>{ fs.mkdirSync('privacy',{recursive:true}); fs.writeFileSync(REG, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/privacy',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(LOG)? fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/consent/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; const key=`${v.subject_id}:${v.purpose}`; o.consents[key]=v; write(o); append({ ts:Date.now(), ...v }); res.json({ ok:true }); });
r.get('/consent/history',(req,res)=>{ const id=String(req.query.subject_id||''); const items=lines().reverse().filter((x:any)=>x.subject_id===id).slice(0,200); res.json({ items }); });
export default r;
