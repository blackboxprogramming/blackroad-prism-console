import { Router } from 'express';
import fs from 'fs';
const r = Router(); const I='portfolio/initiatives.json';
const read=()=> fs.existsSync(I)? JSON.parse(fs.readFileSync(I,'utf-8')):{ initiatives:{} };
const write=(o:any)=>{ fs.mkdirSync('portfolio',{recursive:true}); fs.writeFileSync(I, JSON.stringify(o,null,2)); };
r.post('/initiatives/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.initiatives[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/initiatives/:id',(req,res)=>{ res.json(read().initiatives[String(req.params.id)]||null); });
export default r;
