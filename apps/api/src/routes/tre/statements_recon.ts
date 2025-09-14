import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='data/treasury/statements.jsonl', R='data/treasury/recon.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/statements/ingest',(req,res)=>{ append(S,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/statements/recent',(req,res)=>{ const acc=String(req.query.accountId||''), per=String(req.query.period||''); const items=lines(S).reverse().filter((x:any)=>(!acc||x.accountId===acc)&&(!per||x.period===per)).slice(0,200); res.json({ items }); });
r.post('/recon/match',(req,res)=>{
  const accountId=String(req.body?.accountId||''); const period=String(req.body?.period||'');
  const st=lines(S).filter((x:any)=>x.accountId===accountId && x.period===period).flatMap((x:any)=>(x.lines||[]));
  const credits=st.filter((l:any)=>l.type==='credit').reduce((s:number,l:any)=>s+Number(l.amount||0),0);
  const debits =st.filter((l:any)=>l.type==='debit').reduce((s:number,l:any)=>s+Number(l.amount||0),0);
  const net=credits-debits; const row={ ts:Date.now(), accountId, period, credits, debits, net };
  append(R,row); res.json({ ok:true, summary: row });
});
export default r;
