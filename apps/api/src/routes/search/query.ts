import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.get('/', (req, res) => {
  const q = String(req.query.q||'').toLowerCase();
  if (!q) return res.json({ hits: [] });
  if (!fs.existsSync('data/search/index.jsonl')) return res.json({ hits: [] });
  const rows = fs.readFileSync('data/search/index.jsonl','utf-8').trim().split('\n').map(l=>JSON.parse(l));
  const hits = rows.filter((x:any)=>(x.text||'').toLowerCase().includes(q)).slice(0,25);
  res.json({ hits });
});
export default r;
