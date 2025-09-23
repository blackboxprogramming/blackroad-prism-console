import { Router } from 'express';
import fs from 'fs';
const r = Router(); const A='pa/alerts.json', EV='data/pa/events.jsonl', M='data/pa/metrics.jsonl', AL='data/pa/alerts.jsonl';
const aread=()=> fs.existsSync(A)? JSON.parse(fs.readFileSync(A,'utf-8')):{ rules:[] };
const awrite=(o:any)=>{ fs.mkdirSync('pa',{recursive:true}); fs.writeFileSync(A, JSON.stringify(o,null,2)); };
const elines=()=> fs.existsSync(EV)? fs.readFileSync(EV,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/pa',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/alerts/set',(req,res)=>{ awrite({ rules: req.body?.rules||[] }); res.json({ ok:true }); });

r.post('/alerts/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const events=elines().filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period);
  const activeUsers=new Set(events.map((e:any)=>e.subjectId)).size;
  const row={ ts:Date.now(), period, active_users: activeUsers };
  append(M,row);
  const rules=aread().rules||[]; let fired=0;
  rules.forEach((r:any)=>{ if(r.metric==='active_users'){ const cond= r.op==='<' ? (activeUsers<r.value) : (activeUsers>r.value); if(cond){ append(AL,{ ts:Date.now(), rule:r, period, value:activeUsers }); fired++; } } });
  res.json({ ok:true, metrics: row, alerts_fired: fired });
});

r.get('/metrics/summary',(req,res)=>{
  const p=String(req.query.period||new Date().toISOString().slice(0,7));
  const rows=fs.existsSync(M)? fs.readFileSync(M,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.period===p):[];
  const last=rows.slice(-1)[0]||{active_users:0};
  res.json({ period:p, active_users: last.active_users||0 });
});

r.post('/export/warehouse',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const fmt=String(req.body?.format||'CSV');
  const dir='pa/exports'; fs.mkdirSync(dir,{recursive:true});
  const path=`${dir}/pa_${period.replace('-','')}.${fmt==='CSV'?'csv':'json'}`;
  const rows=fs.existsSync(M)? fs.readFileSync(M,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.period===period):[];
  if(fmt==='CSV'){ fs.writeFileSync(path, `period,active_users\n${rows.map(r=>`${r.period},${r.active_users}`).join('\n')}\n`); }
  else { fs.writeFileSync(path, JSON.stringify(rows,null,2)); }
  res.json({ ok:true, file: path, count: rows.length });
});

export default r;
