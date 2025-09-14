import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const D='data/ar/disputes.jsonl', W='data/ar/writeoffs.jsonl';
const append=(f:string,row:any)=>{ fs.mkdirSync('data/ar',{recursive:true}); fs.appendFileSync(f, JSON.stringify(row)+'\n'); };

r.post('/dispute/open',(req,res)=>{ const id=uuid(); append(D,{ disputeId:id, ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true, disputeId:id }); });
r.post('/dispute/resolve',(req,res)=>{ const rows=fs.existsSync(D)?fs.readFileSync(D,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[]; const i=rows.findIndex((x:any)=>x.disputeId===req.body?.disputeId); if(i<0) return res.status(404).json({error:'not_found'}); rows[i]={...rows[i], state:'closed', outcome:req.body?.outcome, notes:req.body?.notes}; fs.writeFileSync(D, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.post('/writeoff',(req,res)=>{ append(W,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });

r.get('/dispute/recent',(_req,res)=>{ const rows=fs.existsSync(D)?fs.readFileSync(D,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[]; res.json({ items: rows.reverse().slice(0,200) }); });
export default r;
