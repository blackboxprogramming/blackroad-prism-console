import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/ar/cashapp.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/ar',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
r.post('/cash/apply',(req,res)=>{ const { paymentRef, invoiceId, amount } = req.body||{}; append({ ts:Date.now(), paymentRef, invoiceId, amount:Number(amount||0) }); res.json({ ok:true }); });
export default r;
