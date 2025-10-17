import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cs/playbooks.json', PLAN='data/cs/plans.jsonl';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ playbooks:{} };
const write=(o:any)=>{ fs.mkdirSync('cs',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/cs',{recursive:true}); fs.appendFileSync(PLAN, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(PLAN)? fs.readFileSync(PLAN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/playbooks/upsert',(req,res)=>{ const o=read(); const p=req.body||{}; o.playbooks[p.key]=p; write(o); res.json({ ok:true }); });
r.post('/plan/create',(req,res)=>{ append({ ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true }); });
r.post('/plan/update',(req,res)=>{ const rows=list().map((x:any)=> x.planId===req.body?.planId?{...x,tasks:req.body?.tasks||x.tasks,updatedAt:Date.now()}:x); fs.writeFileSync(PLAN, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.get('/plan/:planId',(req,res)=>{ const it=list().find((x:any)=>x.planId===String(req.params.planId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
