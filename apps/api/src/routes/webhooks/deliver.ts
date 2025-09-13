import { Router } from 'express';
import { enqueue } from '../../lib/webhooks/deliver.js';
const r = Router();
r.post('/enqueue', (req, res) => {
  const { url, event, data } = req.body || {};
  if (!url || !event) return res.status(400).json({ error:'bad_request' });
  enqueue(String(url), String(event), data ?? {});
  res.json({ ok: true });
});
export default r;
