import { Router } from 'express';
import fs from 'fs';
const r = Router(); const F='esg/factors.json', A='data/esg/activity.jsonl', E='data/esg/emissions.jsonl';
const fread=()=> fs.existsSync(F)? JSON.parse(fs.readFileSync(F,'utf-8')):{ sources:{} };
const activity=()=> fs.existsSync(A)? fs.readFileSync(A,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const append=(row:any)=>{ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(E, JSON.stringify(row)+'\n'); };
const last=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-1)[0]:null;

r.post('/calc/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const src=String(req.body?.factor_source||process.env.ESG_DEFAULT_FACTOR_SOURCE||'DEFRA_2024');
  const factors=(fread().sources[src]?.items||[]) as any[];
  const data=activity().filter((x:any)=>x.period===period);
  const byScope:{[k:string]:number}={S1:0,S2:0,S3:0};
  for(const a of data){
    const match=factors.find((f:any)=>f.key===a.category) || {factor:0,scope:'S3'};
    byScope[match.scope]= (byScope[match.scope]||0) + Number(a.amount||0)*Number(match.factor||0);
  }
  const row={ ts:Date.now(), period, source:src, S1:Number(byScope.S1.toFixed(4)), S2:Number(byScope.S2.toFixed(4)), S3:Number(byScope.S3.toFixed(4)), total:Number((byScope.S1+byScope.S2+byScope.S3).toFixed(4)) };
  append(row); res.json({ ok:true, snapshot: row });
});
r.get('/calc/snapshot',(req,res)=>{ const per=String(req.query.period||''); const em=fs.existsSync(E)? fs.readFileSync(E,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!per||x.period===per).slice(-1)[0]:null; res.json(em||{}); });
export default r;
