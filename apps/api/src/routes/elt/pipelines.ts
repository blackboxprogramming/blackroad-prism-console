import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='elt/pipelines.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ pipelines:{} };
const write=(o:any)=>{ fs.mkdirSync('elt',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/pipelines/upsert',(req,res)=>{ const o=read(); const p=req.body||{}; o.pipelines[p.id]=p; write(o); res.json({ ok:true }); });
r.get('/pipelines/:id',(req,res)=>{ const o=read(); res.json(o.pipelines[String(req.params.id)]||null); });

export default r;
