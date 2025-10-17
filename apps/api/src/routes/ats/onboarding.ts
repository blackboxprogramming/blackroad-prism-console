import { Router } from 'express';
import fs from 'fs';
const r = Router(); const OB='ats/onboarding.json';
const read=()=> fs.existsSync(OB)? JSON.parse(fs.readFileSync(OB,'utf-8')):{ tasks:{} };
const write=(o:any)=>{ fs.mkdirSync('ats',{recursive:true}); fs.writeFileSync(OB, JSON.stringify(o,null,2)); };
r.post('/onboarding/tasks/set',(req,res)=>{ const o=read(); const v=req.body||{}; o.tasks[v.appId]=v; write(o); res.json({ ok:true }); });
r.post('/onboarding/complete',(req,res)=>{ const o=read(); const v=req.body||{}; const t=(o.tasks[v.appId]?.tasks||[]); const idx=t.findIndex((x:any)=>x.id===v.taskId); if(idx>=0) t[idx].status='done'; write(o); res.json({ ok:true }); });
r.get('/onboarding/status',(req,res)=>{ const app=String(req.query.appId||''); const v=read().tasks[app]||{tasks:[]}; res.json(v); });
export default r;
