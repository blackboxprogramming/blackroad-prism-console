import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cons/entities.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ list:[] };
const write=(o:any)=>{ fs.mkdirSync('cons',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/entities/upsert',(req,res)=>{ const o=read(); const i=o.list.findIndex((x:any)=>x.id===req.body?.id); if(i>=0)o.list[i]=req.body; else o.list.push(req.body); write(o); res.json({ ok:true }); });
r.get('/entities/list',(_req,res)=> res.json(read().list||[]));

export default r;
