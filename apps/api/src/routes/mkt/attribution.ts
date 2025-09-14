import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CFG='mkt/attribution.json', T='data/mkt/touches.jsonl', R='data/mkt/attribution_results.jsonl', SP='data/mkt/spend.jsonl';
const cfg=()=> fs.existsSync(CFG)? JSON.parse(fs.readFileSync(CFG,'utf-8')):{ model: process.env.MKT_DEFAULT_ATTR_MODEL || 'last_click' };
const writeCfg=(o:any)=>{ fs.mkdirSync('mkt',{recursive:true}); fs.writeFileSync(CFG, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/touch',(req,res)=>{ append(T,{ ts:req.body?.ts||Date.now(), touchId:`t_${Math.random().toString(36).slice(2,8)}`, ...req.body }); res.json({ ok:true }); });
r.post('/attr/model/set',(req,res)=>{ writeCfg({ model: req.body?.model || 'last_click' }); res.json({ ok:true }); });
r.post('/attr/compute',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const model=cfg().model;
  const touches=lines(T).filter((x:any)=> String(new Date(x.ts).toISOString().slice(0,7))===period );
  // naive last_click per subject → campaign revenue proxy = conversions logged elsewhere (not included); here count touches per campaign
  const byCamp:Record<string,number>={};
  if(model==='last_click'){
    const lastBySub:Record<string,any>={};
    for(const t of touches){ lastBySub[t.subjectId]=t; }
    Object.values(lastBySub).forEach((t:any)=>{ const key=t.campaignId||`${t.utm?.campaign||'unknown'}`; byCamp[key]=(byCamp[key]||0)+1; });
  }else if(model==='first_touch'){
    const firstBySub:Record<string,any>={};
    for(const t of touches){ if(!firstBySub[t.subjectId]) firstBySub[t.subjectId]=t; }
    Object.values(firstBySub).forEach((t:any)=>{ const key=t.campaignId||`${t.utm?.campaign||'unknown'}`; byCamp[key]=(byCamp[key]||0)+1; });
  }else{ // linear
    const subs=new Map<string,any[]>(); touches.forEach(t=>{ subs.set(t.subjectId, [...(subs.get(t.subjectId)||[]), t]); });
    subs.forEach(arr=>{ arr.forEach(t=>{ const key=t.campaignId||`${t.utm?.campaign||'unknown'}`; byCamp[key]=(byCamp[key]||0)+(1/arr.length); }); });
  }
  append(R,{ ts:Date.now(), period, model, byCampaign: byCamp });
  res.json({ ok:true, model, byCampaign: byCamp });
});
r.get('/attr/results',(req,res)=>{ const p=String(req.query.period||''); const rows=lines(R).filter((x:any)=>!p||x.period===p).slice(-10); res.json({ items: rows }); });

r.post('/spend/ingest',(req,res)=>{ append(SP,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/roas/summary',(req,res)=>{
  const p=String(req.query.period||''); const spend=lines(SP).filter((x:any)=>x.period===p);
  const attr=lines(R).filter((x:any)=>x.period===p).slice(-1)[0]||{byCampaign:{}};
  const byCamp:any={};
  spend.forEach((s:any)=>{ byCamp[s.campaignId]=byCamp[s.campaignId]||{spend:0,attributed: attr.byCampaign[s.campaignId]||0}; byCamp[s.campaignId].spend+=Number(s.amount||0); });
  const rows=Object.entries(byCamp).map(([k,v]:any)=>({ campaignId:k, spend:v.spend, attributed:v.attributed, roas: v.spend? (v.attributed/v.spend):0 }));
  res.json({ period:p, rows });
});

export default r;
