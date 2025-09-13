import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='data/soc/enrichment.jsonl';
function append(row:any){ fs.mkdirSync('data/soc',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }

r.post('/enrich',(req,res)=>{
  const indicator = String(req.body?.indicator||'');
  const type = indicator.includes('.') ? 'domain' : indicator.includes(':') ? 'hash' : 'ip';
  const risk = /mal|bad|evil/i.test(indicator) ? 'high' : 'unknown';
  const out = { indicator, type, risk, ts: Date.now() };
  append(out); res.json(out);
});

r.post('/feeds/upsert',(req,res)=>{
  const f='soc/feeds.json'; const { key, url } = req.body||{};
  const obj = fs.existsSync(f)? JSON.parse(fs.readFileSync(f,'utf-8')) : {};
  obj[key]=url; fs.mkdirSync('soc',{recursive:true}); fs.writeFileSync(f, JSON.stringify(obj,null,2));
  res.json({ ok:true });
});

r.get('/feeds/list',(_req,res)=>{
  const f='soc/feeds.json'; const obj = fs.existsSync(f)? JSON.parse(fs.readFileSync(f,'utf-8')) : {};
  res.json(obj);
});

export default r;
