import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='data/pa/sessions.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/pa',{recursive:true}); fs.appendFileSync(S, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/session/start',(req,res)=>{ append({ ts:req.body?.ts||Date.now(), state:'start', ...req.body }); res.json({ ok:true }); });
r.post('/session/end',(req,res)=>{ append({ ts:req.body?.ts||Date.now(), state:'end', ...req.body }); res.json({ ok:true }); });
r.get('/session/recent',(req,res)=>{ const s=String(req.query.subjectId||''); const items=lines().reverse().filter((x:any)=>!s||x.subjectId===s).slice(0,200); res.json({ items }); });
export default r;
