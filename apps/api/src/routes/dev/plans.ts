
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const PLAN='dev/plans.json', SUB='dev/subscriptions.json';
const pRead=()=> fs.existsSync(PLAN)? JSON.parse(fs.readFileSync(PLAN,'utf-8')):{ plans:[] };
const pWrite=(o:any)=>{ fs.mkdirSync('dev',{recursive:true}); fs.writeFileSync(PLAN, JSON.stringify(o,null,2)); };
const sRead=()=> fs.existsSync(SUB)? JSON.parse(fs.readFileSync(SUB,'utf-8')):{ subs:{} };
const sWrite=(o:any)=>{ fs.mkdirSync('dev',{recursive:true}); fs.writeFileSync(SUB, JSON.stringify(o,null,2)); };

r.post('/plans/set',(req,res)=>{ pWrite({ plans: req.body?.plans||[] }); res.json({ ok:true }); });
r.get('/plans',(_req,res)=>{ res.json(pRead()); });
r.post('/subscriptions/assign',(req,res)=>{ const o=sRead(); const { token, plan_id }=req.body||{}; o.subs[token]={ plan_id, assignedAt: Date.now() }; sWrite(o); res.json({ ok:true }); });

export default r;
