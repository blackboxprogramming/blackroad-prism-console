import { Router } from 'express';
import fs from 'fs';
const r = Router(); const R='release/releases.jsonl', D='release/deploys.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/create',(req,res)=>{ append(R,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/deploy',(req,res)=>{ append(D,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/:releaseId',(req,res)=>{ const it=read(R).reverse().find((x:any)=>x.releaseId===String(req.params.releaseId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
