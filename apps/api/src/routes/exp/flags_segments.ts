import { Router } from 'express';
import fs from 'fs';
const r = Router(); const F='exp/flags.json', S='exp/segments.json';
const fread=()=> fs.existsSync(F)? JSON.parse(fs.readFileSync(F,'utf-8')):{ flags:{} };
const fwrite=(o:any)=>{ fs.mkdirSync('exp',{recursive:true}); fs.writeFileSync(F, JSON.stringify(o,null,2)); };
const sread=()=> fs.existsSync(S)? JSON.parse(fs.readFileSync(S,'utf-8')):{ segments:{} };
const swrite=(o:any)=>{ fs.mkdirSync('exp',{recursive:true}); fs.writeFileSync(S, JSON.stringify(o,null,2)); };

r.post('/flags/upsert',(req,res)=>{ const o=fread(); const v=req.body||{}; o.flags[v.key]=v; fwrite(o); res.json({ ok:true }); });
r.get('/flags/:key',(req,res)=>{ res.json(fread().flags[String(req.params.key)]||null); });

r.post('/segments/upsert',(req,res)=>{ const o=sread(); const v=req.body||{}; o.segments[v.id]=v; swrite(o); res.json({ ok:true }); });
r.get('/segments/:id',(req,res)=>{ res.json(sread().segments[String(req.params.id)]||null); });

export default r;
