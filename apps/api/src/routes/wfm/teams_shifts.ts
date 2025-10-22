import { Router } from 'express';
import fs from 'fs';
const r = Router(); const T='wfm/teams.json', S='wfm/shifts.json';
const tread=()=> fs.existsSync(T)? JSON.parse(fs.readFileSync(T,'utf-8')):{ teams:{} };
const twrite=(o:any)=>{ fs.mkdirSync('wfm',{recursive:true}); fs.writeFileSync(T, JSON.stringify(o,null,2)); };
const sread=()=> fs.existsSync(S)? JSON.parse(fs.readFileSync(S,'utf-8')):{ shifts:{} };
const swrite=(o:any)=>{ fs.mkdirSync('wfm',{recursive:true}); fs.writeFileSync(S, JSON.stringify(o,null,2)); };

r.post('/teams/upsert',(req,res)=>{ const o=tread(); const v=req.body||{}; o.teams[v.id]=v; twrite(o); res.json({ ok:true }); });
r.get('/teams/:id',(req,res)=>{ res.json(tread().teams[String(req.params.id)]||null); });

r.post('/shifts/upsert',(req,res)=>{ const o=sread(); const v=req.body||{}; o.shifts[v.code]=v; swrite(o); res.json({ ok:true }); });
r.get('/shifts/:code',(req,res)=>{ res.json(sread().shifts[String(req.params.code)]||null); });

export default r;
