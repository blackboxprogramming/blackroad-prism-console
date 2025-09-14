import { Router } from 'express';
import fs from 'fs';
const r = Router(); const O='okr/objectives.json', K='okr/krs.json';
const oread=()=> fs.existsSync(O)? JSON.parse(fs.readFileSync(O,'utf-8')):{ objectives:{} };
const owrite=(o:any)=>{ fs.mkdirSync('okr',{recursive:true}); fs.writeFileSync(O, JSON.stringify(o,null,2)); };
const kread=()=> fs.existsSync(K)? JSON.parse(fs.readFileSync(K,'utf-8')):{ krs:{} };
const kwrite=(o:any)=>{ fs.mkdirSync('okr',{recursive:true}); fs.writeFileSync(K, JSON.stringify(o,null,2)); };

r.post('/objectives/upsert',(req,res)=>{ const o=oread(); const v=req.body||{}; o.objectives[v.id]=v; owrite(o); res.json({ ok:true }); });
r.post('/krs/upsert',(req,res)=>{ const o=kread(); const v=req.body||{}; o.krs[v.id]=v; kwrite(o); res.json({ ok:true }); });

export default r;
