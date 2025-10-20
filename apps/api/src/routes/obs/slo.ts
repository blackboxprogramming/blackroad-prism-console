import { Router } from 'express';
import fs from 'fs';
const r = Router(); const SLO='obs/slo.json', EVAL='data/obs/slo_eval.jsonl', MET='data/obs/metrics.jsonl';
const readJson=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const writeJson=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };
const readLines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/obs',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/slo/set',(req,res)=>{ const o=readJson(SLO,{slos:{}}); const s=req.body||{}; o.slos[`${s.service}:${s.sloId}`]=s; writeJson(SLO,o); res.json({ ok:true }); });

r.post('/slo/evaluate',(req,res)=>{
  const service=String(req.body?.service||''); const period=String(req.body?.period||'');
  const slo=readJson(SLO,{slos:{}}).slos||{};
  const def=Object.values(slo).find((x:any)=>x.service===service) as any;
  if(!def) return res.status(404).json({error:'not_found'});
  const metrics=readLines(MET).filter((x:any)=>x.service===service).slice(-500);
  // simple availability: assume a "availability" metric as fraction; latency p95 from points with name 'latency_p95'
  const avgs = metrics.flatMap((m:any)=> (m.points||[]).filter((p:any)=>p.name==='availability').map((p:any)=>Number(p.value||1)));
  const lat  = metrics.flatMap((m:any)=> (m.points||[]).filter((p:any)=>p.name==='latency_p95').map((p:any)=>Number(p.value||0)));
  const availability = avgs.length? avgs.reduce((a,b)=>a+b,0)/avgs.length : 1;
  const p95 = lat.length? lat.sort((a,b)=>a-b)[Math.floor(lat.length*0.95)] : 0;
  let good=true;
  if(def.indicator==='availability'){ good = availability*100 >= (def.objective||99.9); }
  if(def.indicator==='latency'){ good = p95 <= (def.targets?.p95_ms||250); }
  const errBudget = Math.max(0, (def.objective||99.9) - availability*100);
  const row={ ts:Date.now(), service, period, indicator: def.indicator, availability, p95_ms: p95, objective:def.objective||99.9, good, error_budget_pct: Number(errBudget.toFixed(3)) };
  append(EVAL,row); res.json({ ok:true, snapshot: row });
});

r.get('/slo/snapshot',(req,res)=>{
  const service=String(req.query.service||''); const items=readLines(EVAL).reverse().filter((x:any)=>!service||x.service===service).slice(0,12);
  res.json({ items });
});

export default r;
