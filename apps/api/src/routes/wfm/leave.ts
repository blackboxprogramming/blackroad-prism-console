import { Router } from 'express';
import fs from 'fs';
const r = Router(); const P='wfm/policies.json', L='data/wfm/leave.jsonl', A='data/wfm/accruals.jsonl';
const pread=()=> fs.existsSync(P)? JSON.parse(fs.readFileSync(P,'utf-8')):{ policies:{} };
const pwrite=(o:any)=>{ fs.mkdirSync('wfm',{recursive:true}); fs.writeFileSync(P, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/wfm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const list=(p:string)=> fs.existsExists?[]: (fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : []);

r.post('/leave/policies/upsert',(req,res)=>{ const o=pread(); const v=req.body||{}; o.policies[v.id]=v; pwrite(o); res.json({ ok:true }); });

r.post('/leave/request',(req,res)=>{ append(L,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/leave/approve',(req,res)=>{ append(L,{ ts:Date.now(), approval:true, ...req.body }); res.json({ ok:true }); });

r.post('/leave/accruals/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const policies=pread().policies||{}; const reqs=list(L).filter((x:any)=>x.status==='approved' && String(x.start||'').slice(0,7)===period);
  const totals:Record<string,number>={};
  Object.values<any>(policies).forEach(p=>{ /* accrue per subject naive (omitted subjects list); stub record */ });
  reqs.forEach(r=>{ totals[r.subjectId]=(totals[r.subjectId]||0)-Number(r.hours||0); });
  const row={ ts:Date.now(), period, totals }; append(A,row); res.json({ ok:true, accruals: row });
});

r.get('/leave/status',(req,res)=>{ const sid=String(req.query.subjectId||''); const reqs=list(L).filter((x:any)=>x.subjectId===sid).slice(-50); const accr=list(A).slice(-5); res.json({ requests:reqs, accruals:accr }); });

export default r;
