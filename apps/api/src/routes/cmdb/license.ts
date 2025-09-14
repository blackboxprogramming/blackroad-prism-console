import { Router } from 'express';
import fs from 'fs';
const r = Router(); const ENT='cmdb/license.json', USE='data/cmdb/license_usage.jsonl';
const read=()=> fs.existsSync(ENT)? JSON.parse(fs.readFileSync(ENT,'utf-8')):{ entitlements:{} };
const write=(o:any)=>{ fs.mkdirSync('cmdb',{recursive:true}); fs.writeFileSync(ENT, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/cmdb',{recursive:true}); fs.appendFileSync(USE, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(USE)? fs.readFileSync(USE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/license/entitlements/upsert',(req,res)=>{ const o=read(); const e=req.body||{}; o.entitlements[e.product]=e; write(o); res.json({ ok:true }); });
r.post('/license/usage/ingest',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/license/status',(req,res)=>{
  const product=String(req.query.product||''); const ent=read().entitlements?.[product]||{seats:0};
  const usage=lines().filter((x:any)=>x.product===product).slice(-1)[0]||{users:[],hosts:[]};
  const used=new Set([...(usage.users||[]),...(usage.hosts||[])]).size;
  res.json({ product, seats: ent.seats||0, used, variance: (ent.seats||0)-used });
});
export default r;
