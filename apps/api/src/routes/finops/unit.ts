import { Router } from 'express';
import fs from 'fs';
const r = Router(); const COST='data/finops/cost.jsonl', OUT='data/finops/unit.jsonl';
const rows=()=> fs.existsSync(COST)? fs.readFileSync(COST,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const append=(row:any)=>{ fs.mkdirSync('data/finops',{recursive:true}); fs.appendFileSync(OUT, JSON.stringify(row)+'\n'); };
r.post('/unit/calc',(req,res)=>{ const { period, driver, value } = req.body||{}; const sum=rows().filter((x:any)=>x.period===period).reduce((s:number,x:any)=>s+Number(x.cost||0),0); const unit=Number(value||1); const cpu = Number((sum/Math.max(1,unit)).toFixed(6)); const row={ ts:Date.now(), period, driver, value:unit, cost:sum, cost_per_unit: cpu }; append(row); res.json({ ok:true, snapshot: row }); });
r.get('/unit/recent',(req,res)=>{ const p=String(req.query.period||''); const items=fs.existsSync(OUT)? fs.readFileSync(OUT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!p||x.period===p).slice(0,12):[]; res.json({ items }); });
export default r;
