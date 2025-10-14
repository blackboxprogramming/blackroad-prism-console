import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const S='data/cpq/subscriptions.jsonl';
const appendS=(row:any)=>{ fs.mkdirSync('data/cpq',{recursive:true}); fs.appendFileSync(S, JSON.stringify(row)+'\n'); };
const readS=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const readS=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const readS=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/subscription/create',(req,res)=>{ const { customer, sku, qty, start, interval }=req.body||{}; const id=uuid(); appendS({ id, customer, sku, qty:Number(qty||1), start, interval: interval||'month', status:'active', ts: Date.now() }); res.json({ok:true,id}); });
r.get('/subscription/:id',(req,res)=>{ const s=readS().find((x:any)=>x.id===String(req.params.id)); if(!s) return res.status(404).json({error:'not_found'}); res.json(s); });
export default r;
