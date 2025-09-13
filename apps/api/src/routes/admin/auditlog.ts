import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.get('/', (req:any, res) => {
  const orgId = req.org?.id;
  if (!orgId) return res.status(400).json({ error:'org_required' });
  const path = `data/audit/${orgId}.jsonl`;
  if (!fs.existsSync(path)) return res.json({ hits: [] });
  const rows = fs.readFileSync(path,'utf-8').trim().split('\n').map(l=>JSON.parse(l)).slice(-1000);
  res.json({ hits: rows.reverse() });
});
export default r;
