import { Router } from 'express';
import fs from 'fs';
const r = Router(); const KB='support/kb.json';
const read=()=> fs.existsSync(KB)? JSON.parse(fs.readFileSync(KB,'utf-8')):{ articles:{} };
const write=(o:any)=>{ fs.mkdirSync('support',{recursive:true}); fs.writeFileSync(KB, JSON.stringify(o,null,2)); };
r.post('/kb/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.articles[v.id]=v; write(o); res.json({ ok:true }); });
r.get('/kb/search',(req,res)=>{ const q=String(req.query.q||'').toLowerCase(), tag=String(req.query.tag||''); const arts=Object.values<any>(read().articles||{}).filter(a=>(!q||(a.title||'').toLowerCase().includes(q)||(a.md||'').toLowerCase().includes(q)) && (!tag || (a.tags||[]).includes(tag))); res.json({ items: arts.slice(0,200) }); });
const r = Router();

r.post('/kb/publish', (req,res)=>{
  const { slug, title, md } = req.body||{};
  const dir = 'support/kb/articles';
  const man = 'support/kb/manifest.json';
  fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(`${dir}/${slug}.md`, md||'# TBD');
  const m = fs.existsSync(man)? JSON.parse(fs.readFileSync(man,'utf-8')) : { articles:[] };
  const idx = m.articles.findIndex((a:any)=>a.slug===slug);
  if (idx>=0) m.articles[idx] = { slug, title }; else m.articles.push({ slug, title });
  fs.writeFileSync(man, JSON.stringify(m,null,2));
  res.json({ ok:true });
});

r.get('/kb/search', (req,res)=>{
  const q = String(req.query.q||'').toLowerCase();
  const man = 'support/kb/manifest.json';
  const m = fs.existsSync(man)? JSON.parse(fs.readFileSync(man,'utf-8')) : { articles:[] };
  const hits = m.articles.filter((a:any)=>{
    const p = `support/kb/articles/${a.slug}.md`;
    const txt = fs.existsSync(p)? fs.readFileSync(p,'utf-8').toLowerCase() : '';
    return a.slug.includes(q) || a.title.toLowerCase().includes(q) || txt.includes(q);
  }).slice(0,20);
  res.json({ hits });
});

export default r;
