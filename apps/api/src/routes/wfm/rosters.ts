import { Router } from 'express';
import fs from 'fs';
const r = Router(); const R='data/wfm/rosters.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/wfm',{recursive:true}); fs.appendFileSync(R, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(R)? fs.readFileSync(R,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/rosters/create',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/rosters/swap',(req,res)=>{ append({ ts:Date.now(), swap:true, ...req.body }); res.json({ ok:true }); });
r.get('/rosters/recent',(req,res)=>{ const team=String(req.query.teamId||''); const items=list().reverse().filter((x:any)=>!team||x.teamId===team).slice(0,200); res.json({ items }); });
export default r;
