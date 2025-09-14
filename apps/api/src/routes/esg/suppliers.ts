import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='data/esg/supplier_requests.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(S, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
r.post('/suppliers/request',(req,res)=>{ append({ ts:Date.now(), type:'request', ...req.body }); res.json({ ok:true }); });
r.post('/suppliers/submit',(req,res)=>{ append({ ts:Date.now(), type:'submit', ...req.body }); res.json({ ok:true }); });
r.get('/suppliers/status',(req,res)=>{ const vid=String(req.query.vendorId||''); const items=list().filter((x:any)=>x.vendorId===vid).slice(-10); res.json({ items }); });
export default r;
