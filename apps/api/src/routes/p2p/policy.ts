import { Router } from 'express';
import fs from 'fs';
const r = Router(); const POL='p2p/policy.json', MAT='p2p/approval_matrix.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync('p2p',{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };
r.post('/policy/set',(req,res)=>{ write(POL, req.body?.json||{}); res.json({ ok:true }); });
r.post('/approve/matrix/set',(req,res)=>{ write(MAT, req.body||{}); res.json({ ok:true }); });
r.post('/policy/evaluate',(req,res)=>{ const { type, payload }=req.body||{}; res.json({ ok:true, type, compliant:true, notes:[] }); });
export default r;
