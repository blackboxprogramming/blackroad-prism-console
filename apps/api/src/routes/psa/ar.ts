import { Router } from 'express';
import fs from 'fs';
const r = Router(); const BILL='data/psa/billing.jsonl', EXP='data/psa/ar_exports.jsonl';
const read=()=> fs.existsSync(BILL)? fs.readFileSync(BILL,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const append=(row:any)=>{ fs.mkdirSync('data/psa',{recursive:true}); fs.appendFileSync(EXP, JSON.stringify(row)+'\n'); };

r.post('/ar/export',(req,res)=>{
  const billingId=String(req.body?.billingId||''); const b=read().find((x:any)=>x.billingId===billingId); if(!b) return res.status(404).json({error:'not_found'});
  const mode=process.env.PSA_AR_EXPORT_MODE||'file';
  append({ ts:Date.now(), billingId, mode, amount:b.amount });
  res.json({ ok:true, exported: { billingId, mode } });
});
r.get('/ar/recent',(_req,res)=>{ const items=fs.existsSync(EXP)? fs.readFileSync(EXP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,50):[]; res.json({ items }); });

export default r;
