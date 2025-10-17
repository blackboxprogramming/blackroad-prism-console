import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/plan/upsert',(req,res)=>{ const { key, md } = req.body||{}; const p=`bcdr/plans/${key}.md`; fs.mkdirSync('bcdr/plans',{recursive:true}); fs.writeFileSync(p, md||'# BCP Plan'); res.json({ ok:true, file: p }); });
r.get('/plan/:key',(req,res)=>{ const p=`bcdr/plans/${String(req.params.key)}.md`; if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'}); res.type('text/markdown').send(fs.readFileSync(p,'utf-8')); });
export default r;
