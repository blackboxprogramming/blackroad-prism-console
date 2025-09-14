import { Router } from 'express';
import fs from 'fs';
const r = Router(); const B='portal/banners.json';
const read=()=> fs.existsSync(B)? JSON.parse(fs.readFileSync(B,'utf-8')):{ banners:{} };
const write=(o:any)=>{ fs.mkdirSync('portal',{recursive:true}); fs.writeFileSync(B, JSON.stringify(o,null,2)); };
r.post('/banners/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.banners[v.key]=v; write(o); res.json({ ok:true }); });
r.get('/banners/:key',(req,res)=>{ res.json(read().banners[String(req.params.key)]||null); });
export default r;
