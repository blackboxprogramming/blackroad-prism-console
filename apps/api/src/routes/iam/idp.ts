import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='iam/idp.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ idp:{} };
const write=(o:any)=>{ fs.mkdirSync('iam',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/idp/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.idp[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/idp/list',(_req,res)=> res.json(read().idp||{}));
export default r;
