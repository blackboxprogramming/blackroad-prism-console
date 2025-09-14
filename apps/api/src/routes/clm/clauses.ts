import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='clm/clauses.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ clauses:{} };
const write=(o:any)=>{ fs.mkdirSync('clm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/clauses/upsert',(req,res)=>{ const o=read(); const c=req.body||{}; o.clauses[c.id]=c; write(o); res.json({ ok:true }); });
r.get('/clauses/search',(req,res)=>{
  const q=String(req.query.q||'').toLowerCase(), tag=String(req.query.tag||'');
  const o=read().clauses||{}; const items=Object.values<any>(o).filter((c:any)=>(!q || c.title.toLowerCase().includes(q) || (c.body_md||'').toLowerCase().includes(q)) && (!tag || (c.tags||[]).includes(tag)));
  res.json({ items: items.slice(0,200) });
});
export default r;
