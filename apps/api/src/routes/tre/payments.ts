import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const PAY='data/treasury/payments.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.appendFileSync(PAY, JSON.stringify(row)+'\n'); };
const items=()=> fs.existsSync(PAY)? fs.readFileSync(PAY,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/payments/create',(req,res)=>{ append({ ts:Date.now(), state:'created', ...req.body }); res.json({ ok:true }); });
r.post('/payments/approve',(req,res)=>{ append({ ts:Date.now(), approval:true, ...req.body }); res.json({ ok:true }); });
r.post('/payments/export',(req,res)=>{
  const dir=process.env.TRE_PAYMENT_EXPORT_PATH||'treasury/exports'; fs.mkdirSync(dir,{recursive:true});
  const path=`${dir}/pay_${req.body?.batchId||uuid().slice(0,8)}.txt`; fs.writeFileSync(path, `# export ${new Date().toISOString()}\n${(req.body?.paymentIds||[]).join(',')}\n`);
  res.json({ ok:true, file: path });
});
r.get('/payments/recent',(req,res)=>{ const acc=String(req.query.accountId||''); const list=items().reverse().filter((x:any)=>!acc||x.accountId===acc).slice(0,200); res.json({ items: list }); });
export default r;
