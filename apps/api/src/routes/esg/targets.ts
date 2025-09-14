import { Router } from 'express';
import fs from 'fs';
const r = Router(); const T='esg/targets.json';
const read=()=> fs.existsSync(T)? JSON.parse(fs.readFileSync(T,'utf-8')):{ targets:[] };
const write=(o:any)=>{ fs.mkdirSync('esg',{recursive:true}); fs.writeFileSync(T, JSON.stringify(o,null,2)); };
r.post('/targets/set',(req,res)=>{ write({ targets: req.body?.targets||[] }); res.json({ ok:true }); });
r.get('/targets',(_req,res)=>{ res.json(read()); });
export default r;
