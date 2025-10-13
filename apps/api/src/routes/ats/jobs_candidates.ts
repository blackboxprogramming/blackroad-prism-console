import { Router } from 'express';
import fs from 'fs';
const r = Router(); const J='ats/jobs.json', S='ats/stages.json', C='ats/candidates.json';
const jread=()=> fs.existsSync(J)? JSON.parse(fs.readFileSync(J,'utf-8')):{ jobs:{} };
const jwrite=(o:any)=>{ fs.mkdirSync('ats',{recursive:true}); fs.writeFileSync(J, JSON.stringify(o,null,2)); };
const sread=()=> fs.existsSync(S)? JSON.parse(fs.readFileSync(S,'utf-8')):{ list: String(process.env.ATS_DEFAULT_STAGES||'Applied,Phone Screen,Interview,Offer,Accepted').split(',').map(s=>s.trim()) };
const swrite=(o:any)=>{ fs.mkdirSync('ats',{recursive:true}); fs.writeFileSync(S, JSON.stringify(o,null,2)); };
const cread=()=> fs.existsSync(C)? JSON.parse(fs.readFileSync(C,'utf-8')):{ candidates:{} };
const cwrite=(o:any)=>{ fs.mkdirSync('ats',{recursive:true}); fs.writeFileSync(C, JSON.stringify(o,null,2)); };

r.post('/jobs/upsert',(req,res)=>{ const o=jread(); const v=req.body||{}; o.jobs[v.id]=v; jwrite(o); res.json({ ok:true }); });
r.get('/jobs/:id',(req,res)=>{ res.json(jread().jobs[String(req.params.id)]||null); });

r.post('/stages/set',(req,res)=>{ swrite({ list: req.body?.list||sread().list }); res.json({ ok:true }); });
r.get('/stages',(_req,res)=> res.json(sread()));

r.post('/candidates/upsert',(req,res)=>{ const o=cread(); const v=req.body||{}; o.candidates[v.id]=v; cwrite(o); res.json({ ok:true }); });
r.get('/candidates/:id',(req,res)=>{ res.json(cread().candidates[String(req.params.id)]||null); });

export default r;
