import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CH='support/channels.json', RT='support/routing.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/channels/register',(req,res)=>{ const o=read(CH,{channels:{}}); const v=req.body||{}; o.channels[v.key]=v; write(CH,o); res.json({ ok:true }); });
r.get('/channels/list',(_req,res)=>{ res.json(read(CH,{channels:{}}).channels||{}); });

r.post('/routing/set',(req,res)=>{ write(RT,{ rules: req.body?.rules||[] }); res.json({ ok:true }); });

export default r;
