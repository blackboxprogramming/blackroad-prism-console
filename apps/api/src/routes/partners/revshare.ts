import { Router } from 'express';
import fs from 'fs';
const r = Router();

r.get('/revshare/latest', (_req,res)=>{
  const dir = 'partner/reports';
  if (!fs.existsSync(dir)) return res.json({ ok:true, latest:null });
  const files = fs.readdirSync(dir).filter(f=>/^RS_\d{6}\.csv$/.test(f)).sort().reverse();
  res.json({ ok:true, latest: files[0] || null });
});

export default r;
