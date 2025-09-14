import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='data/treasury/statements.jsonl', P='data/treasury/positions.jsonl', F='data/treasury/forecast.jsonl', A='treasury/accounts.json';
const st=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const ac=()=> fs.existsSync(A)? JSON.parse(fs.readFileSync(A,'utf-8')).accounts||{}:{};
const append=(p:string,row:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/position/snapshot',(req,res)=>{
  const date=String(req.body?.date||new Date().toISOString().slice(0,10));
  const d=date; const rows=st().filter((x:any)=> (x.lines||[]).length).map((doc:any)=>({accountId:doc.accountId, balance: (doc.lines||[]).filter((l:any)=>l.date<=d).reduce((s:number,l:any)=> s + (l.type==='credit'?1:-1)*Number(l.amount||0), 0)}));
  const byAcc:Record<string,number>={}; rows.forEach(rw=>{ byAcc[rw.accountId]=(byAcc[rw.accountId]||0)+rw.balance; });
  const snapshot={ ts:Date.now(), date, positions: Object.entries(byAcc).map(([accountId,balance])=>({accountId,currency:ac()[accountId]?.currency||process.env.TRE_DEFAULT_CURRENCY||'USD',balance})) };
  append(P,snapshot); res.json({ ok:true, snapshot });
});

r.post('/forecast/run',(req,res)=>{
  const horizon=Number(req.body?.horizon_days||30);
  const today=new Date().toISOString().slice(0,10);
  const row={ ts:Date.now(), start: today, horizon_days: horizon, method: String(req.body?.method||'simple'), notes:'stub forecast' };
  append(F,row); res.json({ ok:true, forecast: row });
});

r.get('/position/recent',(_req,res)=>{ const items=fs.existsSync(P)? fs.readFileSync(P,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,30):[]; res.json({ items }); });

export default r;
