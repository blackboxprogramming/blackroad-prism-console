import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/treasury/policy.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ rules:{} };
const write=(o:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/policy/set',(req,res)=>{ write(req.body?.json||{rules:{}}); res.json({ ok:true }); });
r.post('/policy/evaluate',(_req,res)=>{ res.json({ ok:true, breaches: [] }); });
export default r;
