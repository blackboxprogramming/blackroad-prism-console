import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/hr/pto_requests.jsonl';
function append(row:any){ fs.mkdirSync('data/hr',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function readAll(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/pto/request',(req,res)=>{ const {employeeId,start,end,type}=req.body||{}; if(!employeeId||!start||!end) return res.status(400).json({error:'bad_request'}); const row={ id:uuid(), ts:Date.now(), employeeId,start,end,type:type||'pto', status:'pending' }; append(row); res.json({ok:true,id:row.id}); });
r.post('/pto/approve',(req,res)=>{ const {requestId,approverId,decision}=req.body||{}; const rows=readAll().map((x:any)=>x.id===requestId?{...x,decision,approverId,decidedAt:Date.now(),status:decision==='approve'?'approved':'rejected'}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ok:true}); });
r.get('/pto/my',(req,res)=>{ const id=String(req.query.employeeId||''); res.json({items:readAll().filter((x:any)=>x.employeeId===id)}); });
r.get('/pto/pending',(_req,res)=>res.json({items:readAll().filter((x:any)=>x.status==='pending')}));

export default r;
