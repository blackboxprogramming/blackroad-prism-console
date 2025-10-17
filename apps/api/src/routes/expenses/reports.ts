import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/expenses/reports.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/expenses',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/report/create',(req,res)=>{ append({ ts:Date.now(), state:'draft', ...req.body }); res.json({ ok:true }); });
r.post('/report/submit',(req,res)=>{ const id=req.body?.reportId; const rows=list().map((x:any)=> x.reportId===id?{...x,state:'submitted'}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.post('/report/approve',(req,res)=>{ const id=req.body?.reportId; const rows=list().map((x:any)=> x.reportId===id?{...x,state:'approved'}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.get('/report/:reportId',(req,res)=>{ const it=list().find((x:any)=>x.reportId===String(req.params.reportId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
