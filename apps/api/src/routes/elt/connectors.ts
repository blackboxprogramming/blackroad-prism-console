import { Router } from 'express';
import fs from 'fs';
const r = Router();
const SRC='elt/sources.json', SNK='elt/sinks.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/sources/upsert',(req,res)=>{ const o=read(SRC,{sources:{}}); const v=req.body||{}; o.sources[v.key]=v; write(SRC,o); res.json({ ok:true }); });
r.post('/sinks/upsert',(req,res)=>{ const o=read(SNK,{sinks:{}}); const v=req.body||{}; o.sinks[v.key]=v; write(SNK,o); res.json({ ok:true }); });
r.get('/sources/list',(_req,res)=> res.json(read(SRC,{sources:{}}).sources||{}));
r.get('/sinks/list',(_req,res)=> res.json(read(SNK,{sinks:{}}).sinks||{}));

export default r;
