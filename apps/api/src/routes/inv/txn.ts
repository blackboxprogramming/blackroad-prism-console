import { Router } from 'express';
import fs from 'fs';
const r = Router(); const TXN='data/inv/txn.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/inv',{recursive:true}); fs.appendFileSync(TXN, JSON.stringify(row)+'\n'); };

r.post('/txn/post',(req,res)=>{
  const row={ ts:Date.now(), loc:req.body?.from_loc||process.env.INV_DEFAULT_LOC||'MAIN', ...req.body };
  append(row); res.json({ ok:true });
});

r.get('/stock/:sku',(req,res)=>{
  if(!fs.existsSync(TXN)) return res.json({ qty:0, layers:[] });
  const sku=String(req.params.sku); const loc=String(req.query.loc||'');
  const rows=fs.readFileSync(TXN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.sku===sku && (!loc || x.to_loc===loc || x.from_loc===loc));
  let qty=0; for(const t of rows){
    if(t.type==='receipt'||(t.type==='transfer'&&t.to_loc)){ qty += Number(t.qty||0); }
    if(t.type==='issue'||(t.type==='transfer'&&t.from_loc)){ qty -= Number(t.qty||0); }
    if(t.type==='adjust'){ qty += Number(t.qty||0); }
  }
  res.json({ sku, loc: loc||process.env.INV_DEFAULT_LOC||'MAIN', qty });
});

export default r;
