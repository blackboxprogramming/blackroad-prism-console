
import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/docs/publish',(req,res)=>{ const { api, markdown }=req.body||{}; const p=`dev/docs/${api}.md`; fs.mkdirSync('dev/docs',{recursive:true}); fs.writeFileSync(p, markdown||'# API'); res.json({ ok:true, file:p }); });
r.get('/docs/:api',(req,res)=>{ const p=`dev/docs/${String(req.params.api)}.md`; if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'}); res.type('text/markdown').send(fs.readFileSync(p,'utf-8')); });
export default r;
