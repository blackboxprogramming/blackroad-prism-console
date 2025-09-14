import { Router } from 'express';
import fs from 'fs';
const r = Router(); const TRANS='data/cons/translated.jsonl', EL='data/cons/elims.jsonl', OUT='data/cons/consolidated.jsonl';
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const append=(row:any)=>{ fs.mkdirSync('data/cons',{recursive:true}); fs.appendFileSync(OUT, JSON.stringify(row)+'\n'); };

r.post('/run/consolidate',(req,res)=>{
  const period=String(req.body?.period||''); const base=String(req.body?.base||'USD');
  const trans=read(TRANS).filter((x:any)=>x.period===period);
  const elims=read(EL).filter((x:any)=>x.period===period).reduce((s:number,x:any)=>s+Number(x.total||0),0);
  const total=trans.reduce((s:number,x:any)=>s+Number(x.total||0),0)+elims;
  const out={ ts:Date.now(), period, base, total: Number(total.toFixed(2)), entities: trans.length, elims };
  append(out); res.json({ ok:true, snapshot: out });
});

r.get('/run/snapshot',(req,res)=>{
  const p=String(req.query.period||''); const rows=read(OUT).filter((x:any)=>!p||x.period===p).slice(-1); res.json(rows[0]||{});
});

export default r;
