import { Router } from 'express';
import fs from 'fs';
const r = Router(); const VAR='data/cost/variance.jsonl', AP='data/p2p/ap_invoices.jsonl', PO='data/p2p/po.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/cost',{recursive:true}); fs.appendFileSync(VAR, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/variance/calc',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const ap=read(AP).filter((x:any)=>String(x.date||'').slice(0,7)===period);
  const po=read(PO);
  let ppv=0;
  for(const inv of ap){
    if(!inv.poId) continue;
    const p=po.find((x:any)=>x.poId===inv.poId); if(!p) continue;
    const invTotal=(inv.lines||[]).reduce((s:number,l:any)=>s+l.qty*l.price,0);
    const poTotal=(p.lines||[]).reduce((s:number,l:any)=>s+l.qty*l.price,0);
    ppv += invTotal - poTotal;
  }
  const row={ ts:Date.now(), period, ppv: Number(ppv.toFixed(2)), usage: 0 }; // usage stub
  append(row); res.json({ ok:true, variance: row });
});
r.get('/variance/recent',(req,res)=>{ const p=String(req.query.period||''); const items=read(VAR).reverse().filter((x:any)=>!p||x.period===p).slice(0,12); res.json({ items }); });
export default r;
