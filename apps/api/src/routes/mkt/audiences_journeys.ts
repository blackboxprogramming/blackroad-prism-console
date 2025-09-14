import { Router } from 'express';
import fs from 'fs';
const r = Router(); const A='mkt/audiences.json', J='mkt/journeys.json';
const aread=()=> fs.existsSync(A)? JSON.parse(fs.readFileSync(A,'utf-8')):{ audiences:{} };
const awrite=(o:any)=>{ fs.mkdirSync('mkt',{recursive:true}); fs.writeFileSync(A, JSON.stringify(o,null,2)); };
const jread=()=> fs.existsSync(J)? JSON.parse(fs.readFileSync(J,'utf-8')):{ journeys:{} };
const jwrite=(o:any)=>{ fs.mkdirSync('mkt',{recursive:true}); fs.writeFileSync(J, JSON.stringify(o,null,2)); };

r.post('/audiences/upsert',(req,res)=>{ const o=aread(); const v=req.body||{}; o.audiences[v.id]=v; awrite(o); res.json({ ok:true }); });
r.get('/audiences/:id',(req,res)=>{ res.json(aread().audiences[String(req.params.id)]||null); });

r.post('/journeys/upsert',(req,res)=>{ const o=jread(); const v=req.body||{}; o.journeys[v.key]=v; jwrite(o); res.json({ ok:true }); });
r.get('/journeys/:key',(req,res)=>{ res.json(jread().journeys[String(req.params.key)]||null); });

export default r;
