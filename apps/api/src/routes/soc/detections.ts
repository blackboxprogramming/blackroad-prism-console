import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router();
const DIR='soc/detections';

r.post('/detections/upsert',(req,res)=>{
  const y = typeof req.body?.yaml==='string'? req.body.yaml : yaml.stringify(req.body?.yaml||req.body);
  const obj = yaml.parse(y);
  if (!obj?.id) return res.status(400).json({ error:'id_required' });
  fs.mkdirSync(DIR,{recursive:true});
  fs.writeFileSync(`${DIR}/${obj.id}.yaml`, y);
  res.json({ ok:true });
});

r.get('/detections/list',(_req,res)=>{
  const items = fs.existsSync(DIR)? fs.readdirSync(DIR).filter(f=>f.endsWith('.yaml')):[];
  res.json({ items });
});

export default r;
