import { Router } from 'express';
import { issueLicense, verifyLicense } from '../../lib/licenses.js';
const r = Router();
r.post('/issue', (req,res) => {
  const { owner, plan, days } = req.body || {};
  const tok = issueLicense(String(owner||'unknown'), String(plan||'STARTER'), Number(days||365));
  res.json({ ok:true, token: tok });
});
r.post('/verify', (req,res) => {
  const { token } = req.body || {};
  res.json(verifyLicense(String(token||'')));
});
export default r;
