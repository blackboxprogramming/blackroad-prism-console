import { Router } from 'express';
import fs from 'fs';
const r = Router(); const PAY='data/tax/payees.json', PMT='data/tax/payments.jsonl';
const readPay=()=> fs.existsSync(PAY)? JSON.parse(fs.readFileSync(PAY,'utf-8')):{ list:[] };
const writePay=(o:any)=>{ fs.mkdirSync('data/tax',{recursive:true}); fs.writeFileSync(PAY, JSON.stringify(o,null,2)); };
const appendPmt=(row:any)=>{ fs.mkdirSync('data/tax',{recursive:true}); fs.appendFileSync(PMT, JSON.stringify(row)+'\n'); };

r.post('/payees/upsert',(req,res)=>{ const o=readPay(); const i=o.list.findIndex((x:any)=>x.id===req.body.id); if(i>=0)o.list[i]=req.body; else o.list.push(req.body); writePay(o); res.json({ok:true}); });
r.post('/payments/record',(req,res)=>{ appendPmt({ ts:Date.now(), ...req.body}); res.json({ok:true}); });

export default r;
