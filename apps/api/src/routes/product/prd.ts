import { Router } from 'express';
import fs from 'fs';
const r = Router();
const IDX='product/prd/index.json';
const dir='product/prd';
const idx=()=> fs.existsSync(IDX)? JSON.parse(fs.readFileSync(IDX,'utf-8')) : { list:[] };
const write=(o:any)=> { fs.mkdirSync('product/prd',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify(o,null,2)); };

r.post('/prd/create',(req,res)=>{
  const { key, title, md } = req.body||{};
  const o=idx(); const exists=o.list.find((x:any)=>x.key===key);
  if (exists) return res.status(409).json({ error:'exists' });
  fs.writeFileSync(`${dir}/${key}.md`, md||'# PRD'); o.list.push({ key, title, reviewers:[] }); write(o); res.json({ ok:true });
});

r.post('/prd/update',(req,res)=>{
  const { key, md } = req.body||{}; if (!key) return res.status(400).json({ error:'key_required' });
  fs.writeFileSync(`${dir}/${key}.md`, md||'# PRD'); res.json({ ok:true });
});

r.post('/prd/request-review',(req,res)=>{
  const { key, reviewers } = req.body||{};
  const o=idx(); const it=o.list.find((x:any)=>x.key===key); if(!it) return res.status(404).json({error:'not_found'});
  it.reviewers = reviewers && reviewers.length ? reviewers : [process.env.PRODUCT_REVIEWERS_DEFAULT||'product@blackroad.io']; write(o);
  res.json({ ok:true, reviewers: it.reviewers });
});

r.get('/prd/:key',(req,res)=>{
  const key=String(req.params.key); const p=`${dir}/${key}.md`; if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'});
  const o=idx().list.find((x:any)=>x.key===key)||{title:key,reviewers:[]};
  res.json({ key, title:o.title, reviewers:o.reviewers, md: fs.readFileSync(p,'utf-8') });
});

export default r;
