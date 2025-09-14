import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cost/items.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ items:{} };
const write=(o:any)=>{ fs.mkdirSync('cost',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/items/upsert',(req,res)=>{
  const o=read(); const { sku, uom, cost_method, std_cost, overhead_rate } = req.body||{};
  o.items[sku]={ sku, uom, cost_method: cost_method||process.env.COST_DEFAULT_METHOD||'standard', std_cost:Number(std_cost||0), overhead_rate:Number(overhead_rate||0) };
  write(o); res.json({ ok:true });
});
r.get('/item/:sku',(req,res)=>{ const o=read(); res.json(o.items[String(req.params.sku)]||null); });

export default r;
