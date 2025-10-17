import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='portal/announcements.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ items:{} };
const write=(o:any)=>{ fs.mkdirSync('portal',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/announcements/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.items[v.id]=Object.assign({state:'draft'}, v); write(o); res.json({ ok:true }); });
r.post('/announcements/state',(req,res)=>{ const o=read(); const id=req.body?.id; if(!o.items[id]) return res.status(404).json({error:'not_found'}); o.items[id].state=req.body?.state||o.items[id].state; write(o); res.json({ ok:true }); });
r.get('/announcements/:id',(req,res)=>{ res.json(read().items[String(req.params.id)]||null); });

r.get('/announcements/search',(req,res)=>{
  const q=String(req.query.q||'').toLowerCase(), tag=String(req.query.tag||'');
  const o=read().items||{};
  const items=Object.values<any>(o).filter(a=>(!q || (a.title||'').toLowerCase().includes(q) || (a.md||'').toLowerCase().includes(q)) && (!tag || (a.tags||[]).includes(tag)));
  res.json({ items: items.slice(0,200) });
});

export default r;
