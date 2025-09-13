import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const P='data/hr/policies.jsonl', A='data/hr/policy_acks.jsonl';
function append(file:string,row:any){ fs.mkdirSync('data/hr',{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n'); }
function read(file:string){ if(!fs.existsSync(file))return[]; return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/policies/publish',(req,res)=>{ const {key,title,version,url}=req.body||{}; append(P,{id:uuid(),key,title,version,url,ts:Date.now()}); res.json({ok:true}); });
r.post('/policies/ack',(req,res)=>{ const {key,employeeId,version}=req.body||{}; append(A,{id:uuid(),key,employeeId,version,ts:Date.now()}); res.json({ok:true}); });
r.get('/policies/status',(req,res)=>{ const emp=String(req.query.employeeId||''); const pub=read(P), ack=read(A).filter((x:any)=>x.employeeId===emp); res.json({published:pub,acks:ack}); });

export default r;
