import { Router } from 'express';
const r = Router();
const applied = new Map<string,{code:string, ts:number}>();
r.post('/apply-coupon', (req:any,res)=>{
  const code = String(req.body?.code||'').toUpperCase();
  const owner = (req.apiKey?.owner)||'unknown';
  if (!code) return res.status(400).json({ error:'bad_request' });
  applied.set(`${owner}:${code}`, { code, ts: Date.now() });
  res.json({ ok:true, owner, code });
});
export default r;
