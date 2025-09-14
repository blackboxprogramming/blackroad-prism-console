import { Router } from 'express';
import fs from 'fs';
const r = Router(); const ROLL='data/cost/rollups.jsonl', ITEMS='cost/items.json';
const append=(row:any)=>{ fs.mkdirSync('data/cost',{recursive:true}); fs.appendFileSync(ROLL, JSON.stringify(row)+'\n'); };
const items=()=> fs.existsSync(ITEMS)? JSON.parse(fs.readFileSync(ITEMS,'utf-8')).items || {} : {};

function getStdCost(sku:string){
  const it=items()[sku]; return it? Number(it.std_cost||0) : 0;
}
function bomRoll(sku:string){
  // Try to read PLM BOM file if exists: plm/bom/<sku>.json
  const p=`plm/bom/${sku}.json`; if(fs.existsSync(p)){ try{ const b=JSON.parse(fs.readFileSync(p,'utf-8')); return (b.components||[]).reduce((s:any,c:any)=> s + getStdCost(c.sku)*Number(c.qty||1), 0); }catch{} }
  return getStdCost(sku);
}

r.post('/rollup',(req,res)=>{
  const sku=String(req.body?.sku||''); const total=bomRoll(sku);
  const row={ ts:Date.now(), sku, std_total: Number(total.toFixed(4)) };
  append(row); res.json({ ok:true, rollup: row });
});
r.get('/rollup/:sku',(req,res)=>{
  if(!fs.existsSync(ROLL)) return res.json({});
  const rows=fs.readFileSync(ROLL,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.sku===String(req.params.sku)).slice(-1);
  res.json(rows[0]||{});
});

export default r;
