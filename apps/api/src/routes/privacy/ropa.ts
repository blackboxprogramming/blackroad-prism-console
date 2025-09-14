import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='privacy/ropa.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ ropa:{} };
const write=(o:any)=>{ fs.mkdirSync('privacy',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/ropa/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.ropa[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/ropa/:id',(req,res)=>{ const o=read(); res.json(o.ropa[String(req.params.id)]||null); });
export default r;
