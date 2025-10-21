import { Router } from 'express';
import fs from 'fs';
const r = Router(); const C='revrec/contracts.jsonl', A='revrec/allocations.jsonl', POL='revrec/policy.json';
const contracts=()=> fs.existsSync(C)? fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const append=(f:string,row:any)=>{ fs.mkdirSync('revrec',{recursive:true}); fs.appendFileSync(f, JSON.stringify(row)+'\n'); };
const policy=()=> (fs.existsSync(POL)? JSON.parse(fs.readFileSync(POL,'utf-8')).policy : { ssp_method:'ratio' });

r.post('/allocate',(req,res)=>{
  const id=String(req.body?.contractId||''); const c=contracts().find((x:any)=>x.id===id); if(!c) return res.status(404).json({error:'not_found'});
  const total_list=(c.lines||[]).reduce((s:number,l:any)=>s+l.price*l.qty,0);
  const total_ssp=(c.lines||[]).reduce((s:number,l:any)=>s+(l.ssp??l.price)*l.qty,0)||total_list||1;
  const alloc=(c.lines||[]).map((l:any)=>{ const ext=l.price*l.qty; const ssp=(l.ssp??l.price)*l.qty; const ratio=ssp/total_ssp; const allocated=total_list*ratio; return { sku:l.sku, qty:l.qty, price:l.price, ssp, allocated, ratio }; });
  append(A,{ ts:Date.now(), contractId:id, alloc });
  res.json({ ok:true, alloc });
});

r.get('/allocations/:contractId',(req,res)=>{
  const items=fs.existsSync(A)?fs.readFileSync(A,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.contractId===String(req.params.contractId)).slice(-1):[];
  res.json(items[0]||{});
});
export default r;
