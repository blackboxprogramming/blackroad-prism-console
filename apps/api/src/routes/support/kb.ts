import { Router } from 'express';
import fs from 'fs';
const r = Router(); const KB='support/kb.json';
const read=()=> fs.existsSync(KB)? JSON.parse(fs.readFileSync(KB,'utf-8')):{ articles:{} };
const write=(o:any)=>{ fs.mkdirSync('support',{recursive:true}); fs.writeFileSync(KB, JSON.stringify(o,null,2)); };
r.post('/kb/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.articles[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/kb/search',(req,res)=>{ const q=String(req.query.q||'').toLowerCase(), tag=String(req.query.tag||''); const arts=Object.values<any>(read().articles||{}).filter(a=>(!q||(a.title||'').toLowerCase().includes(q)||(a.md||'').toLowerCase().includes(q)) && (!tag || (a.tags||[]).includes(tag))); res.json({ items: arts.slice(0,200) }); });
export default r;
