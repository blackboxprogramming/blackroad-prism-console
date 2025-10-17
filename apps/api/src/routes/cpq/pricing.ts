import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router();
const FILE='cpq/pricing_rules.yaml';

r.post('/pricing/rule',(req,res)=>{
  const { key, yaml: y } = req.body||{};
  const obj = fs.existsSync(FILE)? yaml.parse(fs.readFileSync(FILE,'utf-8')) : { rules:{} };
  obj.rules[key] = typeof y==='string' ? yaml.parse(y) : y;
  fs.mkdirSync('cpq',{recursive:true}); fs.writeFileSync(FILE, yaml.stringify(obj));
  res.json({ ok:true });
});

r.get('/pricing/rules',(_req,res)=>{
  const obj = fs.existsSync(FILE)? yaml.parse(fs.readFileSync(FILE,'utf-8')) : { rules:{} };
  res.json(obj);
});

export default r;
