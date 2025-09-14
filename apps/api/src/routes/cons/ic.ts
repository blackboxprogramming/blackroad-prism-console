import { Router } from 'express';
import fs from 'fs';
const r = Router(); const IC='data/cons/ic.jsonl', EL='data/cons/elims.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/cons',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
r.post('/ic/import',(req,res)=>{ append(IC,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/ic/eliminate',(req,res)=>{ const period=String(req.body?.period||''); const rows=read(IC).filter((x:any)=>x.period===period); const total=rows.reduce((s:number,x:any)=>s+Number(x.amount||0),0); append(EL,{ ts:Date.now(), period, total: Number((-1*total).toFixed(2)) }); res.json({ ok:true, eliminated: Number((-1*total).toFixed(2)) }); });
r.get('/ic/results',(req,res)=>{ const p=String(req.query.period||''); const items=read(EL).filter((x:any)=>!p||x.period===p).slice(-10); res.json({ items }); });
export default r;
