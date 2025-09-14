import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/privacy/dsar.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/privacy',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/dsar/create',(req,res)=>{ const row={ ts:Date.now(), state:'open', requestId:req.body?.requestId||uuid(), ...req.body }; append(row); res.json({ ok:true, requestId: row.requestId }); });
r.post('/dsar/verify',(req,res)=>{ const rows=list().map((x:any)=>x.requestId===req.body?.requestId?{...x,verify:{method:req.body?.method,status:req.body?.status,ts:Date.now()}}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.post('/dsar/fulfill',(req,res)=>{ const rows=list().map((x:any)=>x.requestId===req.body?.requestId?{...x,state:'closed',result:req.body?.result,export_path:req.body?.export_path||'',erase_summary:req.body?.erase_summary||'',closedAt:Date.now()}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.get('/dsar/status/:requestId',(req,res)=>{ const it=list().find((x:any)=>x.requestId===String(req.params.requestId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
