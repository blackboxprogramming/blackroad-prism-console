import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const RUN='data/cpm/forecast_runs.jsonl';
function append(row:any){ fs.mkdirSync('data/cpm',{recursive:true}); fs.appendFileSync(RUN, JSON.stringify(row)+'\n'); }

r.post('/forecast/config',(req,res)=>{ append({ id: uuid(), ts:Date.now(), type:'config', ...req.body }); res.json({ ok:true }); });
r.post('/forecast/run',(req,res)=>{ append({ ts:Date.now(), type:'run', id:req.body?.id||'default', status:'ok' }); res.json({ ok:true }); });
r.get('/forecast/snapshot',(req,res)=>{ if(!fs.existsSync(RUN)) return res.json({ items:[] }); const items=fs.readFileSync(RUN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-50); res.json({ items }); });

export default r;
