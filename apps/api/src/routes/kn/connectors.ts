import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='knowledge/connectors.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ connectors:{} };
const write=(o:any)=>{ fs.mkdirSync('knowledge',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/connectors/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.connectors[v.key]=v; write(o); res.json({ ok:true }); });
r.get('/connectors/list',(_req,res)=> res.json(read().connectors||{}));
export default r;
