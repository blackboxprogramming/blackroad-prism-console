import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const r = Router();
const Q='data/cpq/quotes.jsonl', O='data/cpq/orders.jsonl';
const readQ=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const appendO=(row:any)=>{ fs.mkdirSync('data/cpq',{recursive:true}); fs.appendFileSync(O, JSON.stringify(row)+'\n'); };
const readO=()=> fs.existsSync(O)? fs.readFileSync(O,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const readQ=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const appendO=(row:any)=>{ fs.mkdirSync('data/cpq',{recursive:true}); fs.appendFileSync(O, JSON.stringify(row)+'\n'); };
const readO=()=> fs.existsSync(O)? fs.readFileSync(O,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const readQ=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const appendO=(row:any)=>{ fs.mkdirSync('data/cpq',{recursive:true}); fs.appendFileSync(O, JSON.stringify(row)+'\n'); };
const readO=()=> fs.existsSync(O)? fs.readFileSync(O,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/order/create',(req,res)=>{
  const quoteId=String(req.body?.quoteId||''); const q=readQ().find((x:any)=>x.id===quoteId); if(!q) return res.status(404).json({error:'not_found'});
  const id=uuid(); appendO({ id, ts: Date.now(), quoteId, customer: q.customer, total: q.total, lines: q.lines||[], status:'open' });
  res.json({ ok:true, id });
});
r.get('/order/:id',(req,res)=>{ const o=readO().find((x:any)=>x.id===String(req.params.id)); if(!o) return res.status(404).json({error:'not_found'}); res.json(o); });
export default r;
