import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/bcdr/failover.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/bcdr',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/failover/run',(req,res)=>{ append({ ts:Date.now(), status:'running', ...req.body }); res.json({ ok:true }); });
r.get('/failover/status',(req,res)=>{ const svc=String(req.query.service||''); const last=read().reverse().find((x:any)=>!svc||x.service===svc) || null; res.json({ last }); });
export default r;
