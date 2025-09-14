import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='p2p/items.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ list:[] };
const write=(o:any)=>{ fs.mkdirSync('p2p',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/items/upsert',(req,res)=>{ const o=read(); const i=o.list.findIndex((x:any)=>x.sku===req.body?.sku); if(i>=0)o.list[i]=req.body; else o.list.push(req.body); write(o); res.json({ok:true}); });
r.get('/items/list',(_req,res)=> res.json(read().list||[]));
export default r;
