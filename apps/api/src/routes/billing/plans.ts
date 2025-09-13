import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router();
r.get('/', (_req,res) => {
  const cat = yaml.parse(fs.readFileSync('pricing/catalog.yaml','utf-8'));
  res.json(cat);
});
export default r;
