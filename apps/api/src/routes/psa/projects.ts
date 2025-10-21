import { Router } from 'express';
import fs from 'fs';
const r = Router();
const PROJ='psa/projects.json', TASK='psa/tasks.json', RATES='psa/rates.json', ASSIGN='psa/assignments.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync('psa',{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/projects/upsert',(req,res)=>{ const o=read(PROJ,{projects:{}}); const p=req.body||{}; o.projects[p.id]=p; write(PROJ,o); res.json({ ok:true }); });
r.get('/projects/:id',(req,res)=>{ const o=read(PROJ,{projects:{}}); res.json(o.projects[String(req.params.id)]||null); });

r.post('/tasks/upsert',(req,res)=>{ const o=read(TASK,{tasks:{}}); const t=req.body||{}; o.tasks[`${t.projectId}:${t.taskId}`]=t; write(TASK,o); res.json({ ok:true }); });

r.post('/rates/set',(req,res)=>{ const o=read(RATES,{rates:{roles:{},users:{}}}); const { role, rate, currency, userId } = req.body||{}; if(userId){ o.rates.users[userId]={ rate:Number(rate||0), currency }; } else { o.rates.roles[role]={ rate:Number(rate||0), currency }; } write(RATES,o); res.json({ ok:true }); });

r.post('/assign',(req,res)=>{ const o=read(ASSIGN,{assignments:[]}); o.assignments.push(req.body||{}); write(ASSIGN,o); res.json({ ok:true }); });

export default r;
