import { Router } from 'express';
const holds = new Map<string, { ts: number }>();
const r = Router();

r.post('/legal-hold/add', (req,res)=> {
  const key = String(req.body?.email || req.body?.userId || '');
  if (!key) return res.status(400).json({ error:'bad_request' });
  holds.set(key, { ts: Date.now() });
  res.json({ ok:true, count: holds.size });
});

r.post('/legal-hold/remove', (req,res)=> {
  const key = String(req.body?.email || req.body?.userId || '');
  holds.delete(key);
  res.json({ ok:true, count: holds.size });
});

export default r;
