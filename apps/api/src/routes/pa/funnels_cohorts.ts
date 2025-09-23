import { Router } from 'express';
import fs from 'fs';
const r = Router(); const F='pa/funnels.json', C='pa/cohorts.json', FE='data/pa/funnels.jsonl', RE='data/pa/retention.jsonl', EV='data/pa/events.jsonl';
const fread=()=> fs.existsSync(F)? JSON.parse(fs.readFileSync(F,'utf-8')):{ funnels:{} };
const fwrite=(o:any)=>{ fs.mkdirSync('pa',{recursive:true}); fs.writeFileSync(F, JSON.stringify(o,null,2)); };
const cread=()=> fs.existsSync(C)? JSON.parse(fs.readFileSync(C,'utf-8')):{ cohorts:{} };
const cwrite=(o:any)=>{ fs.mkdirSync('pa',{recursive:true}); fs.writeFileSync(C, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/pa',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const elines=()=> fs.existsSync(EV)? fs.readFileSync(EV,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
function inCohort(rule:any, e:any, traitsByUser:Record<string,any>){ if(!rule) return true; if(rule.kind==='event'){ const val=(e.properties||{})[rule.key]; if(rule.op==='eq') return val===rule.value; if(rule.op==='neq') return val!==rule.value; if(rule.op==='contains') return String(val||'').includes(String(rule.value||'')); if(rule.op==='in') return Array.isArray(rule.value)&&rule.value.includes(val); } else { const tv=(traitsByUser[e.subjectId]||{})[rule.key]; if(rule.op==='eq') return tv===rule.value; if(rule.op==='neq') return tv!==rule.value; if(rule.op==='contains') return String(tv||'').includes(String(rule.value||'')); if(rule.op==='in') return Array.isArray(rule.value)&&rule.value.includes(tv); } return false; }

r.post('/funnel/define',(req,res)=>{ const o=fread(); const v=req.body||{}; o.funnels[v.funnelId]=v; fwrite(o); res.json({ ok:true }); });
r.post('/funnel/run',(req,res)=>{
  const { funnelId, period } = req.body||{}; const f=fread().funnels[funnelId]||{steps:[]};
  const events=elines().filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period);
  const byUser:Record<string,any[]>={}; events.forEach(e=>{ byUser[e.subjectId]=[...(byUser[e.subjectId]||[]), e]; });
  let counts:number[]=[]; let cohortUsers=new Set(Object.keys(byUser));
  f.steps.forEach((step:any,i:number)=>{ const nextUsers=new Set<string>(); cohortUsers.forEach(u=>{ const evts=(byUser[u]||[]).filter(ev=> ev.event===step.event); if(evts.length){ nextUsers.add(u); } }); counts[i]=nextUsers.size; cohortUsers=nextUsers; });
  const row={ ts:Date.now(), funnelId, period, counts }; append(FE,row); res.json({ ok:true, counts });
});

r.post('/cohorts/upsert',(req,res)=>{ const o=cread(); const v=req.body||{}; o.cohorts[v.id]=v; cwrite(o); res.json({ ok:true }); });
r.get('/cohorts/:id',(req,res)=>{ res.json(cread().cohorts[String(req.params.id)]||null); });

r.post('/retention/run',(req,res)=>{
  const { anchor_event, return_event, window_days, period } = req.body||{};
  const ev=elines().filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period);
  const anchor=ev.filter((e:any)=>e.event===anchor_event); const returns=ev.filter((e:any)=>e.event===return_event);
  const byUserFirst:Record<string,number>={}; anchor.forEach(a=>{ byUserFirst[a.subjectId]=Math.min(byUserFirst[a.subjectId]||Infinity, a.ts); });
  let retained=0, total=Object.keys(byUserFirst).length;
  returns.forEach(rw=>{ const first=byUserFirst[rw.subjectId]; if(first && (rw.ts-first)<=window_days*86400000) retained++; });
  const rate = total? Number((retained/total).toFixed(4)) : 0;
  const row={ ts:Date.now(), anchor_event, return_event, window_days, period, retained, total, rate }; append(RE,row); res.json({ ok:true, retained, total, rate });
});

export default r;
