import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/esg/dei.jsonl';
function append(row:any){ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }
r.post('/dei/upsert',(req,res)=>{ const row={ id:uuid(), ts:Date.now(), ...req.body }; append(row); res.json({ ok:true }); });
r.get('/dei/snapshot',(req,res)=>{ const p=String(req.query.period||''); const rows=read().filter((x:any)=>!p||x.period===p).slice(-1); res.json({ snapshot: rows[0]||null }); });
export default r;
