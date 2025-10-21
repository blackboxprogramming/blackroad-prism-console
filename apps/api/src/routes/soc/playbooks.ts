import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router(); const FILE='soc/playbooks.yaml', RUN='data/soc/playbook_runs.jsonl';
const runAppend=(row:any)=>{ fs.mkdirSync('data/soc',{recursive:true}); fs.appendFileSync(RUN, JSON.stringify(row)+'\n'); };

r.post('/playbooks/upsert',(req,res)=>{ const y=typeof req.body?.yaml==='string'?req.body.yaml:yaml.stringify(req.body?.yaml||req.body); fs.mkdirSync('soc',{recursive:true}); fs.writeFileSync(FILE,y); res.json({ok:true}); });
r.post('/playbooks/execute',(req,res)=>{ const { key, caseId }=req.body||{}; runAppend({ key, caseId, ts: Date.now(), result:'executed (stub)' }); res.json({ ok:true }); });

export default r;
