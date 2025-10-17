import { Router } from 'express';
import fs from 'fs';
const r = Router(); const C='lms/courses.json', P='lms/paths.json';
const cread=()=> fs.existsSync(C)? JSON.parse(fs.readFileSync(C,'utf-8')):{ courses:{} };
const cwrite=(o:any)=>{ fs.mkdirSync('lms',{recursive:true}); fs.writeFileSync(C, JSON.stringify(o,null,2)); };
const pread=()=> fs.existsSync(P)? JSON.parse(fs.readFileSync(P,'utf-8')):{ paths:{} };
const pwrite=(o:any)=>{ fs.mkdirSync('lms',{recursive:true}); fs.writeFileSync(P, JSON.stringify(o,null,2)); };

r.post('/courses/upsert',(req,res)=>{ const o=cread(); const v=req.body||{}; o.courses[v.id]=v; cwrite(o); res.json({ ok:true }); });
r.get('/courses/:id',(req,res)=>{ res.json(cread().courses[String(req.params.id)]||null); });

r.post('/paths/upsert',(req,res)=>{ const o=pread(); const v=req.body||{}; o.paths[v.key]=v; pwrite(o); res.json({ ok:true }); });
r.get('/paths/:key',(req,res)=>{ res.json(pread().paths[String(req.params.key)]||null); });

export default r;
