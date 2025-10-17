import { Router } from 'express';
import fs from 'fs';
const r = Router(); const SIG='treasury/signatories.json', PAY='data/treasury/payments.jsonl';
const read=()=> fs.existsSync(SIG)? JSON.parse(fs.readFileSync(SIG,'utf-8')):{ list:[] };
const write=(o:any)=>{ fs.mkdirSync('treasury',{recursive:true}); fs.writeFileSync(SIG, JSON.stringify(o,null,2)); };
const pays=()=> fs.existsSync(PAY)? fs.readFileSync(PAY,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/signatories/set',(req,res)=>{ write({ list: req.body?.list||[] }); res.json({ ok:true }); });
r.post('/limits/check',(req,res)=>{
  const p=(pays().reverse().find((x:any)=>x.paymentId===req.body?.paymentId))||null;
  if(!p) return res.status(404).json({ok:false,reason:'payment_not_found'});
  const limit=Number(process.env.TRE_APPROVAL_THRESHOLD||50000);
  const ok = Number(p.amount||0) <= limit;
  res.json({ ok, reason: ok?undefined:`over_limit ${limit}` });
});
export default r;
