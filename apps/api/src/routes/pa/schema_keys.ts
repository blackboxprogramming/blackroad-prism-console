import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const S='pa/schema.json', K='pa/sdk_keys.json';
const sread=()=> fs.existsSync(S)? JSON.parse(fs.readFileSync(S,'utf-8')):{ events:[] };
const swrite=(o:any)=>{ fs.mkdirSync('pa',{recursive:true}); fs.writeFileSync(S, JSON.stringify(o,null,2)); };
const kread=()=> fs.existsSync(K)? JSON.parse(fs.readFileSync(K,'utf-8')):{ keys:[] };
const kwrite=(o:any)=>{ fs.mkdirSync('pa',{recursive:true}); fs.writeFileSync(K, JSON.stringify(o,null,2)); };

r.post('/events/schema/set',(req,res)=>{ swrite({ events: req.body?.events||[] }); res.json({ ok:true }); });
r.get('/events/schema',(_req,res)=> res.json(sread()));

r.post('/sdk/keys/mint',(req,res)=>{ const o=kread(); const key=`pk_${uuid().slice(0,12)}`; o.keys.push({ write_key:key, ...req.body }); kwrite(o); res.json({ ok:true, write_key:key }); });
r.get('/sdk/keys',(_req,res)=> res.json(kread()));

export default r;
