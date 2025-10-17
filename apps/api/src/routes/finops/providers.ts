import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='finops/providers.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ providers:{} };
const write=(o:any)=>{ fs.mkdirSync('finops',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/providers/upsert',(req,res)=>{ const o=read(); const p=req.body||{}; o.providers[p.id]=p; write(o); res.json({ ok:true }); });
r.get('/providers/list',(_req,res)=> res.json(read().providers||{}));
export default r;
