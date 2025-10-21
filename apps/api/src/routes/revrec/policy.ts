import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='revrec/policy.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ policy:{ ssp_method:'ratio', schedule_default: process.env.REVREC_DEFAULT_METHOD || 'straight' } };
const write=(o:any)=>{ fs.mkdirSync('revrec',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/policy/set',(req,res)=>{ write({ policy: req.body?.policy||read().policy }); res.json({ ok:true }); });
r.get('/policy',(_req,res)=> res.json(read()));
export default r;
