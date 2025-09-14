
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const MTR='data/dev/metering.jsonl';
const lines=()=> fs.existsSync(MTR)? fs.readFileSync(MTR,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.get('/analytics/summary',(req,res)=>{
  const period=String(req.query.period||new Date().toISOString().slice(0,7));
  const rows=lines().filter((x:any)=> String(new Date(x.ts).toISOString().slice(0,7))===period );
  const byKey:Record<string,number>={}; rows.forEach((r:any)=>{ byKey[r.key]=(byKey[r.key]||0)+Number(r.units||1); });
  const total=rows.reduce((s:number,r:any)=>s+Number(r.units||1),0);
  res.json({ period, total, byKey });
});
export default r;
