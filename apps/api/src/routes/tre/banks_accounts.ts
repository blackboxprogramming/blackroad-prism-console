import { Router } from 'express';
import fs from 'fs';
const r = Router(); const B='treasury/banks.json', A='treasury/accounts.json';
const bread=()=> fs.existsSync(B)? JSON.parse(fs.readFileSync(B,'utf-8')):{ banks:{} };
const bwrite=(o:any)=>{ fs.mkdirSync('treasury',{recursive:true}); fs.writeFileSync(B, JSON.stringify(o,null,2)); };
const aread=()=> fs.existsSync(A)? JSON.parse(fs.readFileSync(A,'utf-8')):{ accounts:{} };
const awrite=(o:any)=>{ fs.mkdirSync('treasury',{recursive:true}); fs.writeFileSync(A, JSON.stringify(o,null,2)); };

r.post('/banks/upsert',(req,res)=>{ const o=bread(); const v=req.body||{}; o.banks[v.bankId]=v; bwrite(o); res.json({ ok:true }); });
r.get('/banks/:bankId',(req,res)=>{ res.json(bread().banks[String(req.params.bankId)]||null); });

r.post('/accounts/upsert',(req,res)=>{ const o=aread(); const v=req.body||{}; o.accounts[v.accountId]=v; awrite(o); res.json({ ok:true }); });
r.get('/accounts/:accountId',(req,res)=>{ res.json(aread().accounts[String(req.params.accountId)]||null); });

export default r;
