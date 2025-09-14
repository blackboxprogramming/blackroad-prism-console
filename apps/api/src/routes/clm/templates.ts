import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='clm/templates.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ templates:{} };
const write=(o:any)=>{ fs.mkdirSync('clm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/templates/upsert',(req,res)=>{ const o=read(); const t=req.body||{}; o.templates[t.key]=t; write(o); res.json({ ok:true }); });
r.get('/templates/:key',(req,res)=>{ const o=read(); res.json(o.templates[String(req.params.key)]||null); });
export default r;
