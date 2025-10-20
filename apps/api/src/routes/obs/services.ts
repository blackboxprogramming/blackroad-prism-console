import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='obs/services.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ services:{} };
const write=(o:any)=>{ fs.mkdirSync('obs',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/services/upsert',(req,res)=>{ const o=read(); const s=req.body||{}; o.services[s.service]=s; write(o); res.json({ ok:true }); });
r.get('/services/:service',(req,res)=>{ const o=read(); res.json(o.services[String(req.params.service)]||null); });

export default r;
