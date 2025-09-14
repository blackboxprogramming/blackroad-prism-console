import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cs/weights.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ weights:{product_usage:0.4,support:0.2,nps:0.2,finance:0.2} };
const write=(o:any)=>{ fs.mkdirSync('cs',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/weights/set',(req,res)=>{ write({ weights: req.body?.weights||read().weights }); res.json({ ok:true }); });
r.get('/weights',(_req,res)=> res.json(read()));
export default r;
