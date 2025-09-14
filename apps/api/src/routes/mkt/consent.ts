import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CONS='privacy/consents.json';
r.post('/consent/check',(req,res)=>{
  const id=String(req.body?.subjectId||''); const p=String(req.body?.purpose||'marketing');
  const o=fs.existsSync(CONS)? JSON.parse(fs.readFileSync(CONS,'utf-8')):{consents:{}};
  const key=`${id}:${p}`; const status=o.consents?.[key]?.status||'withdrawn';
  res.json({ allowed: status==='granted' });
});
export default r;
