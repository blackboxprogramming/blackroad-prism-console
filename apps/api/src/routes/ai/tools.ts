import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='ai/tools/catalog.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ tools:{} };
const write=(o:any)=> { fs.mkdirSync('ai/tools',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/tools/upsert',(req,res)=>{ const { name, json }=req.body||{}; const o=read(); o.tools[name]=json; write(o); res.json({ok:true}); });
r.get('/tools/list',(_req,res)=> res.json(read().tools||{}));

export default r;
