import { Router } from 'express';
import fs from 'fs';
const r = Router(); const OUT='data/finops/recs.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/finops',{recursive:true}); fs.appendFileSync(OUT, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(OUT)? fs.readFileSync(OUT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/recs/run',(req,res)=>{ const { provider, period } = req.body||{}; append({ ts:Date.now(), provider, period, coverage_target: Number(process.env.FINOPS_RI_TARGET_COVERAGE||0.7), reserved_commit_suggestion: 1000, savings_estimate: 150 }); res.json({ ok:true }); });
r.get('/recs/recent',(req,res)=>{ const p=String(req.query.provider||''); const items=read().reverse().filter((x:any)=>!p||x.provider===p).slice(0,50); res.json({ items }); });
export default r;
