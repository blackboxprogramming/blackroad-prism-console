import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='data/mkt/templates.json';

r.post('/templates/upsert', (req,res)=>{
  const { key, channel, a, b, split } = req.body||{};
  const obj = fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')) : {};
  const resolvedSplit = Number(split ?? (process.env.MKT_DEFAULT_SPLIT ?? 50));
  obj[key] = { channel, a, b: b||null, split: resolvedSplit };
  fs.mkdirSync('data/mkt',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(obj,null,2));
  res.json({ ok:true });
});

r.get('/templates/:key', (req,res)=>{
  const obj = fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')) : {};
  const item = obj[String(req.params.key)];
  if (!item) return res.status(404).json({ error:'not_found' });
  res.json(item);
});

export default r;
