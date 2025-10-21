import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/soc/cases.jsonl';
function append(row:any){ fs.mkdirSync('data/soc',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE)) return []; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/cases/create',(req,res)=>{
  const { title, severity, alerts } = req.body||{};
  const id=uuid(); append({ id, ts: Date.now(), title, severity: severity||'medium', alerts: alerts||[], notes:[], tasks:[], state:'open' });
  res.json({ ok:true, id });
});

r.post('/cases/:id/note',(req,res)=>{ const id=String(req.params.id); const rows=read().map((x:any)=> x.id===id?{...x, notes:[...(x.notes||[]), { ts:Date.now(), author:req.body?.author, text:req.body?.text }]}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ok:true}); });
r.post('/cases/:id/task',(req,res)=>{ const id=String(req.params.id); const rows=read().map((x:any)=> x.id===id?{...x, tasks:[...(x.tasks||[]), { ts:Date.now(), title:req.body?.title, assignee:req.body?.assignee, done:false }]}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ok:true}); });
r.post('/cases/:id/state',(req,res)=>{ const id=String(req.params.id); const rows=read().map((x:any)=> x.id===id?{...x, state:req.body?.state||x.state }:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ok:true}); });
r.get('/cases/recent',(req,res)=>{ const st=String(req.query.state||''); const items=read().reverse().slice(0,200).filter((x:any)=>!st||x.state===st); res.json({items}); });

export default r;
