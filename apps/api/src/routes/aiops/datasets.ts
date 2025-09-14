import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='aiops/datasets.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ datasets:{} };
const write=(o:any)=>{ fs.mkdirSync('aiops',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/datasets/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.datasets[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/datasets/:id',(req,res)=>{ const o=read(); res.json(o.datasets[String(req.params.id)]||null); });
export default r;
