import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='bcdr/policies.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ policies:{} };
const write=(o:any)=>{ fs.mkdirSync('bcdr',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/policy/set',(req,res)=>{
  const o=read(); const s=req.body?.service||'';
  const rec={ service:s, rto_min: Number(req.body?.rto_min ?? process.env.BCDR_DEFAULT_RTO_MIN || 60), rpo_min: Number(req.body?.rpo_min ?? process.env.BCDR_DEFAULT_RPO_MIN || 30), tier:req.body?.tier||'silver', dependencies:req.body?.dependencies||[] };
  o.policies[s]=rec; write(o); res.json({ ok:true });
});

r.get('/policy/:service',(req,res)=>{ const o=read(); res.json(o.policies[String(req.params.service)]||null); });

export default r;
