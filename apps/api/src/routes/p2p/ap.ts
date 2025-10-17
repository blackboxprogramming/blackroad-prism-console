import { Router } from 'express';
import fs from 'fs';
const r = Router();
const AP='data/p2p/ap_invoices.jsonl', MR='data/p2p/match_results.jsonl', PO='data/p2p/po.jsonl', RC='data/p2p/receipts.jsonl';
const append=(f:string,row:any)=>{ fs.mkdirSync('data/p2p',{recursive:true}); fs.appendFileSync(f, JSON.stringify(row)+'\n'); };
const read=(f:string)=> fs.existsSync(f)? fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/ap/invoice/capture',(req,res)=>{ append(AP,{ ts:Date.now(), state:'captured', ...req.body }); res.json({ ok:true }); });
r.post('/ap/match/run',(req,res)=>{
  const invId=String(req.body?.invId||''); const inv=read(AP).find((x:any)=>x.invId===invId); if(!inv) return res.status(404).json({error:'not_found'});
  const po=inv.poId ? read(PO).find((x:any)=>x.poId===inv.poId) : null;
  const rc=inv.poId ? read(RC).filter((x:any)=>x.poId===inv.poId) : [];
  const tol = Number(process.env.P2P_MATCH_TOLERANCE_BPS||50)/10000;
  const invTotal=(inv.lines||[]).reduce((s:number,l:any)=>s+l.qty*l.price,0);
  const poTotal=po ? (po.lines||[]).reduce((s:number,l:any)=>s+l.qty*l.price,0) : 0;
  const receivedQty=rc.reduce((m:any,r:any)=>{ for(const l of (r.lines||[])){ m[l.sku]=(m[l.sku]||0)+l.qty_received; } return m; },{});
  const qtyMatch=(inv.lines||[]).every((l:any)=> (receivedQty[l.sku]||0) >= l.qty);
  const priceDelta=Math.abs(invTotal - poTotal);
  const priceOk = po ? (priceDelta <= poTotal*tol) : true;
  const matched = (!!po) && qtyMatch && priceOk;
  const out={ ts:Date.now(), invId, matched, qtyMatch, priceOk, priceDelta, tolerance_bps: Number(process.env.P2P_MATCH_TOLERANCE_BPS||50) };
  append(MR,out); res.json({ ok:true, ...out });
});
r.post('/ap/approve',(req,res)=>{ res.json({ ok:true }); });
r.post('/ap/export',(req,res)=>{ append('data/p2p/ap_exports.jsonl',{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/ap/invoice/:invId',(req,res)=>{ const inv=read(AP).find((x:any)=>x.invId===String(req.params.invId)); if(!inv) return res.status(404).json({error:'not_found'}); res.json(inv); });
export default r;
