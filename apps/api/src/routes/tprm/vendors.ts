import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='tprm/vendors.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ vendors:{} };
const write=(o:any)=>{ fs.mkdirSync('tprm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/vendors/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.vendors[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/vendors/:id',(req,res)=>{ const o=read(); res.json(o.vendors[String(req.params.id)]||null); });
export default r;
