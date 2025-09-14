import { Router } from 'express';
import fs from 'fs';
const r = Router(); const O='data/clm/obligations.jsonl', R='data/clm/renewals.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/clm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/obligations/upsert',(req,res)=>{ const items=(req.body?.items||[]).map((i:any)=>({...i,contractId:req.body?.contractId})); append(O,{ ts:Date.now(), contractId:req.body?.contractId, items }); res.json({ ok:true }); });
r.post('/renewals/set',(req,res)=>{ append(R,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/renewals/upcoming',(req,res)=>{ const win=Number(req.query.window_days||90); const now=Date.now(); const rows=read(R).filter((x:any)=> new Date(x.renewal_date).getTime() - now <= win*86400000 ); res.json({ items: rows.slice(0,200) }); });
export default r;
