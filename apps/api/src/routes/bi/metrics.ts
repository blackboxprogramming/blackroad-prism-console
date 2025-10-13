import { Router } from 'express';
import fs from 'fs';
const r = Router();

r.get('/metrics/snapshot', (_req,res)=>{
  const p = `warehouse/metrics/snapshot.json`;
  if (!fs.existsSync(p)) return res.json({ ts: null, metrics: {} });
  res.json(JSON.parse(fs.readFileSync(p,'utf-8')));
});

export default r;
