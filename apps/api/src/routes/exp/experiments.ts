import { Router } from 'express';
import fs from 'fs';
const r = Router(); const E='exp/experiments.json';
const read=()=> fs.existsSync(E)? JSON.parse(fs.readFileSync(E,'utf-8')):{ experiments:{} };
const write=(o:any)=>{ fs.mkdirSync('exp',{recursive:true}); fs.writeFileSync(E, JSON.stringify(o,null,2)); };

r.post('/experiments/create',(req,res)=>{ const o=read(); const v=req.body||{}; o.experiments[v.expId]=Object.assign({ state:'draft' }, v); write(o); res.json({ ok:true }); });
r.post('/experiments/state',(req,res)=>{ const o=read(); const id=req.body?.expId; if(!o.experiments[id]) return res.status(404).json({error:'not_found'}); o.experiments[id].state=req.body?.state||o.experiments[id].state; write(o); res.json({ ok:true }); });
r.get('/experiments/:expId',(req,res)=>{ res.json(read().experiments[String(req.params.expId)]||null); });

export default r;
