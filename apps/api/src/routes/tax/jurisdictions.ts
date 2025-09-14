import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='tax/jurisdictions.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ list:[] };
const write=(o:any)=>{ fs.mkdirSync('tax',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/jurisdictions/upsert',(req,res)=>{ const o=read(); const i=o.list.findIndex((x:any)=>x.code===req.body.code); if(i>=0)o.list[i]=req.body; else o.list.push(req.body); write(o); res.json({ok:true}); });
r.get('/jurisdictions/list',(_req,res)=> res.json(read().list||[]));

export default r;
