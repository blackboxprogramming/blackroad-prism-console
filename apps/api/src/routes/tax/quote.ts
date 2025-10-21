import { Router } from 'express';
import fs from 'fs';
const r = Router(); const J='tax/jurisdictions.json', T='tax/taxability.json';
const juris=()=> fs.existsSync(J)? JSON.parse(fs.readFileSync(J,'utf-8')).list:[]; const taxab=()=> fs.existsSync(T)? JSON.parse(fs.readFileSync(T,'utf-8')).items:[];
r.post('/quote',(req,res)=>{
  const { lines, ship_to } = req.body||{}; const j = juris().find((x:any)=>x.code===ship_to?.code) || { rate: 0 };
  const items=(lines||[]).map((l:any)=>{ const tx=taxab().find((t:any)=>t.sku===l.sku && t.jurisdiction===ship_to?.code); const rate = tx?.exempt ? 0 : (tx?.rate_override ?? j.rate ?? 0); const tax = (l.price*l.qty)*rate; return { ...l, rate, tax }; });
  const tax_total=items.reduce((s:number,i:any)=>s+i.tax,0); res.json({ ok:true, tax_total, items });
});
export default r;
