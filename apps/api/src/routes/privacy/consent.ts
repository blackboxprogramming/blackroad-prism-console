import { Router } from 'express';
import fs from 'fs';
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
