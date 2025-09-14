import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='tprm/mapping.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ maps:{} };
const write=(o:any)=>{ fs.mkdirSync('tprm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/map/contract',(req,res)=>{ const o=read(); const v=req.body||{}; o.maps[v.vendorId]=v; write(o); res.json({ ok:true }); });
r.get('/map/:vendorId',(req,res)=>{ const o=read(); res.json(o.maps[String(req.params.vendorId)]||null); });
export default r;
