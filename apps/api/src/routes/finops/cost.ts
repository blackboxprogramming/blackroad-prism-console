import { Router } from 'express';
import fs from 'fs';
const r = Router(); const COST='data/finops/cost.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/finops',{recursive:true}); fs.appendFileSync(COST, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(COST)? fs.readFileSync(COST,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/ingest/cost',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/cost/snapshot',(req,res)=>{ const p=String(req.query.period||''), prov=String(req.query.provider||''); const items=read().filter((x:any)=>(!p||x.period===p)&&(!prov||x.provider===prov)).slice(-50); res.json({ items }); });
export default r;
