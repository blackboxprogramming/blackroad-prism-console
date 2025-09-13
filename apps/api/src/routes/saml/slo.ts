import { Router } from 'express';
const r = Router();
r.post('/slo', (_req,res)=>{ res.redirect('/'); });
export default r;
