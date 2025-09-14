import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='aiops/features.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ features:{} };
const write=(o:any)=>{ fs.mkdirSync('aiops',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/features/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.features[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/features/:id',(req,res)=>{ const o=read(); res.json(o.features[String(req.params.id)]||null); });
export default r;
