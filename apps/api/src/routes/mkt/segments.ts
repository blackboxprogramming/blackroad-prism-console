import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router();
const DEF='marketing/segments/definitions.yaml';
const OUT='data/mkt/segments';

r.post('/segments/upsert', (req,res)=>{
  const { key, name, yaml: y } = req.body||{};
  const defs = fs.existsSync(DEF)? yaml.parse(fs.readFileSync(DEF,'utf-8')) : { segments:{} };
  defs.segments[key] = { name, where: (typeof y==='string'?yaml.parse(y):y).where || y.where || {} };
  fs.writeFileSync(DEF, yaml.stringify(defs));
  res.json({ ok:true });
});

r.get('/segments/list', (_req,res)=>{
  const defs = fs.existsSync(DEF)? yaml.parse(fs.readFileSync(DEF,'utf-8')) : { segments:{} };
  res.json(defs.segments||{});
});

r.post('/segments/compute', (req,res)=>{
  const key = String(req.body?.key||'');
  if (!key) return res.status(400).json({ error:'key_required' });
  const members = []; // stub: pull from profiles/warehouse in production
  fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(`${OUT}/${key}.json`, JSON.stringify(members,null,2));
  res.json({ ok:true, file: `${OUT}/${key}.json` });
});

export default r;
