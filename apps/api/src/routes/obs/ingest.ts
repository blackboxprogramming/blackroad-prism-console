import { Router } from 'express';
import fs from 'fs';
const r = Router();
const M='data/obs/metrics.jsonl', L='data/obs/logs.jsonl', T='data/obs/traces.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/obs',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/ingest/metrics',(req,res)=>{ append(M,{ ts: req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/ingest/logs',   (req,res)=>{ append(L,{ ts: Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/ingest/trace',  (req,res)=>{ append(T,{ ts: Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/metrics/recent',(req,res)=>{ const s=String(req.query.service||''); const items=read(M).reverse().filter((x:any)=>!s||x.service===s).slice(0,200); res.json({ items }); });
export default r;
