import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='privacy/dpia.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ dpias:{} };
const write=(o:any)=>{ fs.mkdirSync('privacy',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/dpia/create',(req,res)=>{ const o=read(); const v=req.body||{}; o.dpias[v.dpiaId]=v; write(o); res.json({ ok:true }); });
r.get('/dpia/:dpiaId',(req,res)=>{ const o=read(); res.json(o.dpias[String(req.params.dpiaId)]||null); });
export default r;
