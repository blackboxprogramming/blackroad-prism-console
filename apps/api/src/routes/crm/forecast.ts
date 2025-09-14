
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const OPP='crm/opps.json', OUT='data/crm/forecast.jsonl', STG='crm/stages.json';
const opps=()=> fs.existsSync(OPP)? JSON.parse(fs.readFileSync(OPP,'utf-8')).opps||{}:{};
const stages=()=> fs.existsSync(STG)? JSON.parse(fs.readFileSync(STG,'utf-8')).stages||[]:[];
const append=(row:any)=>{ fs.mkdirSync('data/crm',{recursive:true}); fs.appendFileSync(OUT, JSON.stringify(row)+'\n'); };
r.post('/forecast/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const model=String(req.body?.model||process.env.CRM_FORECAST_MODEL||'best');
  const overlay=Number(req.body?.overlay||0);
  const list=Object.values(opps()) as any[];
  const byStage=new Map(stages().map((s:any)=>[s.name, s.probability||0]));
  let commit=0,best=0,pipeline=0;
  for(const o of list){
    const p=byStage.get(o.stage)||o.probability||0;
    pipeline += Number(o.amount||0);
    best     += Number(o.amount||0)*Math.max(p,0.5);
    if((o.stage||'').toLowerCase().includes('commit') || p>=0.9) commit += Number(o.amount||0);
  }
  const value = model==='commit'?commit : model==='pipeline'?pipeline : best;
  const total = Number((value + overlay).toFixed(2));
  const row={ ts:Date.now(), period, model, commit, best, pipeline, total };
  append(row); res.json({ ok:true, snapshot: row });
});
r.get('/forecast/snapshot',(req,res)=>{
  const p=String(req.query.period||''); if(!fs.existsSync(OUT)) return res.json({ items: [] });
  const rows=fs.readFileSync(OUT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!p||x.period===p).slice(-5);
  res.json({ items: rows });
});
export default r;

