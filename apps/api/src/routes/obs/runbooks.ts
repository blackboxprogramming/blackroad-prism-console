import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/runbooks/upsert',(req,res)=>{ const { service, md } = req.body||{}; const p=`obs/runbooks/${service}.md`; fs.mkdirSync('obs/runbooks',{recursive:true}); fs.writeFileSync(p, md||'# Runbook'); res.json({ ok:true, file:p }); });
r.get('/runbooks/:service',(req,res)=>{ const p=`obs/runbooks/${String(req.params.service)}.md`; if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'}); res.type('text/markdown').send(fs.readFileSync(p,'utf-8')); });
export default r;
