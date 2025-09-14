import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/esg/activity.jsonl';
function append(row:any){ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
r.post('/activity/capture',(req,res)=>{
  const { type, scope, amount, unit, source, period } = req.body||{};
  const row = { ts: Date.now(), type, scope, amount:Number(amount||0), unit, source, period };
  append(row); res.json({ ok:true });
});
export default r;
