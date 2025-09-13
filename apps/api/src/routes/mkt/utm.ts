import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/mkt/utm.jsonl';
r.post('/utm/capture', (req,res)=>{
  const row = { ...req.body, ts: Date.now() };
  fs.mkdirSync('data/mkt',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n');
  res.json({ ok:true });
});
export default r;
