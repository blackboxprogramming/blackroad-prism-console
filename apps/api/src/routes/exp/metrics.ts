import { Router } from 'express';
import fs from 'fs';
const r = Router(); const M='exp/metrics.json', R='data/exp/results.jsonl', X='data/exp/exposures.jsonl', C='data/exp/conversions.jsonl';
const mRead=()=> fs.existsSync(M)? JSON.parse(fs.readFileSync(M,'utf-8')):{ metrics:{} };
const mWrite=(o:any)=>{ fs.mkdirSync('exp',{recursive:true}); fs.writeFileSync(M, JSON.stringify(o,null,2)); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const append=(row:any)=>{ fs.mkdirSync('data/exp',{recursive:true}); fs.appendFileSync(R, JSON.stringify(row)+'\n'); };

r.post('/metrics/register',(req,res)=>{ const o=mRead(); const v=req.body||{}; o.metrics[v.metric]=v; mWrite(o); res.json({ ok:true }); });

r.post('/analyze',(req,res)=>{
  const { expId, method } = req.body||{};
  // naive analysis: conversion rate per variant over primary metric = first registered metric or 'primary'
  const expo=lines(X).filter((x:any)=>x.expId===expId);
  const conv=lines(C).filter((x:any)=>x.expId===expId);
  const byVar:Record<string,{expo:number,conv:number}>={};
  expo.forEach((e:any)=>{ const v=e.variant||'control'; byVar[v]=byVar[v]||{expo:0,conv:0}; byVar[v].expo++; });
  conv.forEach((c:any)=>{ const v=c.variant||'control'; byVar[v]=byVar[v]||{expo:0,conv:0}; byVar[v].conv += Number(c.value||1); });
  const results=Object.entries(byVar).map(([v,s])=>({ variant:v, exposures:s.expo, conversions:s.conv, rate: s.expo? s.conv/s.expo : 0 }));
  const row={ ts:Date.now(), expId, method: method||process.env.EXP_DEFAULT_METHOD||'bayes', results };
  append(row); res.json({ ok:true, results });
});

r.get('/results/:expId',(req,res)=>{ const id=String(req.params.expId); const items=lines(R).reverse().filter((x:any)=>x.expId===id).slice(0,10); res.json({ items }); });

export default r;
