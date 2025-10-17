import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/tprm/breaches.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/tprm',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/breach/report',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/breach/recent',(req,res)=>{ const vid=String(req.query.vendorId||''); const items=list().reverse().filter((x:any)=>!vid||x.vendorId===vid).slice(0,200); res.json({ items }); });
export default r;
