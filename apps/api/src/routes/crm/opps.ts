
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='crm/opps.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ opps:{} };
const write=(o:any)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/opps/upsert',(req,res)=>{ const o=read(); const op=req.body||{}; o.opps[op.id]=op; write(o); res.json({ ok:true }); });
r.get('/opps/:id',(req,res)=>{ const o=read(); res.json(o.opps[String(req.params.id)]||null); });
export default r;

