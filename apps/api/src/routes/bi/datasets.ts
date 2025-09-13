import { Router } from 'express';
import fs from 'fs';
const r = Router();

r.get('/dataset/:name', (req,res)=>{
  const name = String(req.params.name);
  const p = `warehouse/data/curated/${name}.json`;
  if (!fs.existsSync(p)) return res.status(404).json({ error:'not_found' });
  res.type('application/json').send(fs.readFileSync(p,'utf-8'));
});

export default r;
