import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/hr/training_assignments.jsonl';
function append(row:any){ fs.mkdirSync('data/hr',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/training/assign',(req,res)=>{ const {employeeId,course,due}=req.body||{}; const id=uuid(); append({id,employeeId,course,due,status:'assigned',ts:Date.now()}); res.json({ok:true,id}); });
r.post('/training/complete',(req,res)=>{ const {assignmentId}=req.body||{}; const rows=read().map((x:any)=>x.id===assignmentId?{...x,status:'completed',completedAt:Date.now()}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ok:true}); });
r.get('/training/pending',(req,res)=>{ const emp=String(req.query.employeeId||''); res.json({items:read().filter((x:any)=>x.employeeId===emp&&x.status!=='completed')}); });

export default r;
