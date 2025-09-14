import { Router } from 'express';
import fs from 'fs';
const r = Router(); const COST='data/finops/cost.jsonl', OUT='data/finops/anomalies.jsonl';
const lines=()=> fs.existsSync(COST)? fs.readFileSync(COST,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const append=(row:any)=>{ fs.mkdirSync('data/finops',{recursive:true}); fs.appendFileSync(OUT, JSON.stringify(row)+'\n'); };

r.post('/anomaly/run',(req,res)=>{
  const period=String(req.body?.period||'');
  const rows=lines().filter((x:any)=>x.period===period);
  const byKey = new Map<string,{sum:number,count:number}>();
  for(const r of rows){
    const k = `${r.project||'org'}|${r.service||'svc'}`;
    const v = byKey.get(k)||{sum:0,count:0};
    v.sum += Number(r.cost||0); v.count += 1; byKey.set(k,v);
  }
  const th=Number(process.env.FINOPS_ANOMALY_THRESHOLD||0.3);
  const out:any[]=[];
  byKey.forEach((v,k)=>{ const avg=v.sum/Math.max(1,v.count); const latest=rows.filter((x:any)=>`${x.project||'org'}|${x.service||'svc'}`===k).slice(-1)[0]?.cost||0; const delta=(latest-avg)/Math.max(1,avg); if(delta>th) out.push({ ts:Date.now(), period, key:k, avg:Number(avg.toFixed(2)), latest:Number(latest.toFixed(2)), delta:Number(delta.toFixed(3)) }); });
  out.forEach(o=>append(o));
  res.json({ ok:true, count: out.length });
});

r.get('/anomaly/recent',(_req,res)=>{ const items=fs.existsSync(OUT)? fs.readFileSync(OUT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,100):[]; res.json({ items }); });
export default r;
