import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='product/roadmap/roadmap.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')) : { items:[] };
const write=(o:any)=> { fs.mkdirSync('product/roadmap',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/roadmap/upsert',(req,res)=>{
  const { quarter, epic, title, owner, status, links } = req.body||{};
  const o=read(); const i=o.items.findIndex((x:any)=>x.quarter===quarter && x.epic===epic);
  const row={ quarter, epic, title, owner, status: status||'planned', links: Array.isArray(links)?links:[] };
  if (i>=0) o.items[i]=row; else o.items.push(row); write(o); res.json({ ok:true });
});

r.get('/roadmap/:quarter',(req,res)=>{
  const q=String(req.params.quarter); const o=read();
  res.json({ items: (o.items||[]).filter((x:any)=>x.quarter===q) });
});

export default r;
