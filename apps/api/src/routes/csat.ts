import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/submit', (req, res) => {
  const row = { ts: Date.now(), rating: Number(req.body?.rating||0), comment: String(req.body?.comment||'') };
  fs.appendFileSync('csat.jsonl', JSON.stringify(row)+'\n');
  res.json({ ok:true });
});
export default r;
