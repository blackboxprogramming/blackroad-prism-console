import { Router } from 'express';
import fs from 'fs';
const r = Router(); const T='cs/onboarding.json', RUN='data/cs/onboarding.jsonl';
const read=()=> fs.existsSync(T)? JSON.parse(fs.readFileSync(T,'utf-8')):{ templates:{} };
const write=(o:any)=>{ fs.mkdirSync('cs',{recursive:true}); fs.writeFileSync(T, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/cs',{recursive:true}); fs.appendFileSync(RUN, JSON.stringify(row)+'\n'); };
const runs=()=> fs.existsSync(RUN)? fs.readFileSync(RUN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/onboarding/template',(req,res)=>{ const o=read(); const t=req.body||{}; o.templates[t.key]=t; write(o); res.json({ ok:true }); });
r.post('/onboarding/start',(req,res)=>{ append({ ts:Date.now(), state:'in_progress', ...req.body }); res.json({ ok:true }); });
r.get('/onboarding/status',(req,res)=>{ const id=String(req.query.accountId||''); const it=runs().filter((x:any)=>x.accountId===id).slice(-1)[0]||null; res.json({ run: it }); });
export default r;
