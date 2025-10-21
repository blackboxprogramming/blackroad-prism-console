import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='tax/taxability.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ items:[] };
const write=(o:any)=>{ fs.mkdirSync('tax',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/taxability/upsert',(req,res)=>{
  const o=read(); const idx=o.items.findIndex((x:any)=>x.sku===req.body.sku && x.jurisdiction===req.body.jurisdiction);
  if(idx>=0) o.items[idx]=req.body; else o.items.push(req.body);
  write(o); res.json({ ok:true });
});

export default r;
