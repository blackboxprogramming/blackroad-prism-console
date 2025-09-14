import { Router } from 'express';
import fs from 'fs';
const r = Router();
const LOC='fac/locations.json', SPC='fac/spaces.json';
const lread=()=> fs.existsSync(LOC)? JSON.parse(fs.readFileSync(LOC,'utf-8')):{ locations:{} };
const lwrite=(o:any)=>{ fs.mkdirSync('fac',{recursive:true}); fs.writeFileSync(LOC, JSON.stringify(o,null,2)); };
const sread=()=> fs.existsSync(SPC)? JSON.parse(fs.readFileSync(SPC,'utf-8')):{ spaces:{} };
const swrite=(o:any)=>{ fs.mkdirSync('fac',{recursive:true}); fs.writeFileSync(SPC, JSON.stringify(o,null,2)); };

r.post('/locations/upsert',(req,res)=>{ const o=lread(); const v=req.body||{}; o.locations[v.id]=v; lwrite(o); res.json({ ok:true }); });
r.get('/locations/:id',(req,res)=>{ res.json(lread().locations[String(req.params.id)]||null); });

r.post('/spaces/upsert',(req,res)=>{ const o=sread(); const v=req.body||{}; o.spaces[v.id]=v; swrite(o); res.json({ ok:true }); });
r.get('/spaces/:id',(req,res)=>{ res.json(sread().spaces[String(req.params.id)]||null); });

export default r;
