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
import path from 'path';
const r = Router();

function append(row:any){
  const dir = 'data/privacy'; const file = path.join(dir,'consent.jsonl');
  fs.mkdirSync(dir,{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n');
}
function readAll(subjectId:string){
  const file = 'data/privacy/consent.jsonl';
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.subjectId===subjectId);
}

r.post('/consent/upsert', (req,res)=>{
  const { subjectId, channel, purpose, granted, region } = req.body || {};
  if (!subjectId || !purpose) return res.status(400).json({ error:'bad_request' });
  const row = { ts: Date.now(), subjectId, channel: String(channel||'web'), purpose: String(purpose), granted: Boolean(granted), region: String(region||'') };
  append(row); res.json({ ok:true });
});

r.get('/consent/:subjectId', (req,res)=> res.json({ events: readAll(String(req.params.subjectId)) }));

export default r;
