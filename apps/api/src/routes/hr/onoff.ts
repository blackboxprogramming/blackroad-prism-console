import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const ON='data/hr/onboarding.jsonl', OFF='data/hr/offboarding.jsonl', TASK='data/hr/tasks.jsonl';
function append(file:string, row:any){ fs.mkdirSync('data/hr',{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n'); }
function find(file:string, id:string){ if(!fs.existsSync(file))return null; return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).find((x:any)=>x.id===id)||null; }

r.post('/onboarding/create',(req,res)=>{ const { email,name,role,managerId,startDate }=req.body||{}; if(!email||!name) return res.status(400).json({error:'bad_request'}); const id=uuid(); append(ON,{id,ts:Date.now(),email,name,role,managerId,startDate,status:'open'}); append(TASK,{flowId:id,taskId:'accounts',title:'Provision accounts',status:'open'}); append(TASK,{flowId:id,taskId:'equipment',title:'Ship equipment',status:'open'}); res.json({ok:true,id}); });
r.post('/offboarding/create',(req,res)=>{ const { employeeId,lastDay,checklist }=req.body||{}; const id=uuid(); append(OFF,{id,ts:Date.now(),employeeId,lastDay,status:'open',checklist:checklist||['disable accounts','collect equipment','final payroll']}); res.json({ok:true,id}); });
r.get('/onboarding/:id',(req,res)=>res.json(find(ON,String(req.params.id))||{error:'not_found'}));
r.get('/offboarding/:id',(req,res)=>res.json(find(OFF,String(req.params.id))||{error:'not_found'}));
r.post('/task/:flowId/complete',(req,res)=>{ const { notes,taskId }=req.body||{}; if(!taskId) return res.status(400).json({error:'bad_request'}); append(TASK,{flowId:String(req.params.flowId),taskId,status:'done',notes:notes||'',ts:Date.now()}); res.json({ok:true}); });

export default r;
