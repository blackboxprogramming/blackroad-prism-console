import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/iam/access.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/iam',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/access/request',(req,res)=>{ append({ ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true }); });
r.post('/access/approve',(req,res)=>{ const rows=read().map((x:any)=> x.requestId===req.body?.requestId?{...x,approvedBy:req.body?.approver,decision:req.body?.decision,state:'closed',closedAt:Date.now()}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.get('/access/recent',(_req,res)=>{ res.json({ items: read().reverse().slice(0,200) }); });
export default r;
