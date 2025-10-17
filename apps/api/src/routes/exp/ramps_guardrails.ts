import { Router } from 'express';
import fs from 'fs';
const r = Router(); const RP='exp/ramps.json', RG='data/exp/guardrails.jsonl', E='exp/experiments.json';
const rpRead=()=> fs.existsSync(RP)? JSON.parse(fs.readFileSync(RP,'utf-8')):{ ramps:{} };
const rpWrite=(o:any)=>{ fs.mkdirSync('exp',{recursive:true}); fs.writeFileSync(RP, JSON.stringify(o,null,2)); };
const eRead=()=> fs.existsSync(E)? JSON.parse(fs.readFileSync(E,'utf-8')).experiments||{}:{};
const gAppend=(row:any)=>{ fs.mkdirSync('data/exp',{recursive:true}); fs.appendFileSync(RG, JSON.stringify(row)+'\n'); };

r.post('/ramp/set',(req,res)=>{ const o=rpRead(); const v=req.body||{}; o.ramps[v.expId]=v.schedule||[]; rpWrite(o); res.json({ ok:true }); });
r.get('/ramp/:expId',(req,res)=>{ const o=rpRead(); res.json({ schedule: o.ramps[String(req.params.expId)]||[] }); });

r.post('/guardrails/check',(req,res)=>{
  const expId=String(req.body?.expId||''); const exp=eRead()[expId]||{};
  const guard=exp?.guardrails||{};
  // simplistic thresholds: if results rate drops or obs signals (not integrated) — just record stub
  const result={ ts:Date.now(), expId, status:'ok', thresholds:guard };
  gAppend(result); res.json({ ok:true, result });
});

export default r;
