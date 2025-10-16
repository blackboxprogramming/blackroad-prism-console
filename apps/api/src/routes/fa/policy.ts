import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='fa/policy.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ policy:{ methods:['SL','DDB','SYD'] } };
const write=(o:any)=>{ fs.mkdirSync('fa',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/policy/set',(req,res)=>{ write({ policy: req.body?.json||read().policy }); res.json({ ok:true }); });
r.get('/policy',(_req,res)=> res.json(read()));
export default r;
