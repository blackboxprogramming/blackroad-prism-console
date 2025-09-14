import { Router } from 'express';
import fs from 'fs';
const r = Router();
const U='data/cs/usage.jsonl', S='data/cs/support.jsonl', F='data/cs/finance.jsonl', N='data/cs/nps.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/cs',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/signals/usage',  (req,res)=>{ append(U,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/signals/support',(req,res)=>{ append(S,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/signals/finance',(req,res)=>{ append(F,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/signals/nps',    (req,res)=>{ append(N,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/signals/recent',(req,res)=>{
  const id=String(req.query.accountId||'');
  const usage = read(U).reverse().filter((x:any)=>!id||x.accountId===id).slice(0,50);
  const supp  = read(S).reverse().filter((x:any)=>!id||x.accountId===id).slice(0,50);
  const fin   = read(F).reverse().filter((x:any)=>!id||x.accountId===id).slice(0,50);
  const nps   = read(N).reverse().filter((x:any)=>!id||x.accountId===id).slice(0,50);
  res.json({ usage, support: supp, finance: fin, nps });
});
export default r;
