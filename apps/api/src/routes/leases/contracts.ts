import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='leases/contracts.jsonl';
const append=(row:any)=>{ fs.mkdirSync('leases',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/contract/create',(req,res)=>{ const id=req.body?.leaseId||uuid(); append({ leaseId:id, ts:Date.now(), ...req.body }); res.json({ ok:true, leaseId:id }); });
r.get('/contract/:leaseId',(req,res)=>{ const it=list().find((x:any)=>x.leaseId===String(req.params.leaseId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
