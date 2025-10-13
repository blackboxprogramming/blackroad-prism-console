import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/ar/payments.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/ar',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(FILE)?fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/payment/record',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/payment/recent',(req,res)=>{ const id=String(req.query.invoiceId||''); const items=list().reverse().filter((x:any)=>!id||x.invoiceId===id).slice(0,200); res.json({ items }); });
export default r;
