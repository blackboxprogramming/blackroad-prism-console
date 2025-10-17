import { Router } from 'express';
import fs from 'fs';
const r = Router(); const R='portfolio/roadmaps.json';
const read=()=> fs.existsSync(R)? JSON.parse(fs.readFileSync(R,'utf-8')):{ roadmaps:{} };
const write=(o:any)=>{ fs.mkdirSync('portfolio',{recursive:true}); fs.writeFileSync(R, JSON.stringify(o,null,2)); };
r.post('/roadmaps/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.roadmaps[v.key]=v; write(o); res.json({ ok:true }); });
r.get('/roadmaps/:key',(req,res)=>{ res.json(read().roadmaps[String(req.params.key)]||null); });
export default r;
