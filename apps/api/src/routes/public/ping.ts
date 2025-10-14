import { Router } from 'express';
const r = Router();
r.get('/', (_req,res)=> res.json({ ok:true, ts: Date.now() }));
export default r;
