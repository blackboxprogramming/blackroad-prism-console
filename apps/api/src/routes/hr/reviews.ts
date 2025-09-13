import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const C='data/hr/reviews_cycles.jsonl', P='data/hr/reviews_packets.jsonl', F='data/hr/reviews_feedback.jsonl';
function append(file:string,row:any){ fs.mkdirSync('data/hr',{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n'); }
function read(file:string){ if(!fs.existsSync(file))return[]; return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/reviews/cycle',(req,res)=>{ const {name,start,end}=req.body||{}; const id=uuid(); append(C,{id,name,start,end,ts:Date.now()}); res.json({ok:true,id}); });
r.post('/reviews/packet',(req,res)=>{ const {cycleId,employeeId}=req.body||{}; const id=uuid(); append(P,{id,cycleId,employeeId,status:'open'}); res.json({ok:true,id}); });
r.post('/reviews/feedback',(req,res)=>{ const {packetId,authorId,text}=req.body||{}; append(F,{id:uuid(),packetId,authorId,text,ts:Date.now()}); res.json({ok:true}); });
r.post('/reviews/finalize',(req,res)=>{ const {packetId,rating}=req.body||{}; const rows=read(P).map((x:any)=>x.id===packetId?{...x,status:'final',rating}:x); fs.writeFileSync(P, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ok:true}); });
r.get('/reviews/packets',(req,res)=>{ const cycleId=String(req.query.cycleId||''); res.json({items:read(P).filter((x:any)=>x.cycleId===cycleId)}); });

export default r;
