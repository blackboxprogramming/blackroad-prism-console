import { Router } from 'express';
import fs from 'fs';
const r = Router(); const MO='data/cost/mo.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/cost',{recursive:true}); fs.appendFileSync(MO, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(MO)? fs.readFileSync(MO,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/mo/create',(req,res)=>{ append({ ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true }); });
r.post('/mo/complete',(req,res)=>{ const rows=list().map((x:any)=> x.moId===req.body?.moId?{...x,state:'closed',completedAt:Date.now(),qty_good:req.body?.qty_good,qty_scrap:req.body?.qty_scrap||0}:x); fs.writeFileSync(MO, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.get('/mo/:moId',(req,res)=>{ const it=list().find((x:any)=>x.moId===String(req.params.moId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
