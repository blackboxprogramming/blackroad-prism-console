import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='data/cpq/catalog.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')) : { items:[] };
const write=(o:any)=> { fs.mkdirSync('data/cpq',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/catalog/upsert',(req,res)=>{
  const { sku, name, family, plan, uom, price, currency, metered, addons } = req.body||{};
  const o = read(); const i = o.items.findIndex((x:any)=>x.sku===sku);
  const row = { sku, name, family, plan, uom, price:Number(price||0), currency: currency||process.env.CPQ_DEFAULT_CURRENCY||'USD', metered:Boolean(metered), addons: Array.isArray(addons)?addons:[] };
  if (i>=0) o.items[i]=row; else o.items.push(row);
  write(o); res.json({ ok:true });
});

r.get('/catalog/list',(_req,res)=> res.json(read()));

export default r;
