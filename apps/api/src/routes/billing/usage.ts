import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.get('/', (req:any, res) => {
  const key = (req.apiKey?.key) || 'anon';
  const month = new Date().toISOString().slice(0,7).replace('-','');
  const path = `data/metering/usage-${month}.jsonl`;
  if (!fs.existsSync(path)) return res.json({ month, key, total: 0 });
  const lines = fs.readFileSync(path,'utf-8').trim().split('\n').map(l=>JSON.parse(l));
  const total = lines.filter((x:any)=>x.key===key).length;
  res.json({ month, key, total });
});
export default r;
