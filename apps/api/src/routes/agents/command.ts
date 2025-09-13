import { Router } from 'express';
import { enqueue } from '../../../../agents/command_bus.js';
const r = Router();
r.post('/', (req:any, res) => {
  const { text, source } = req.body || {};
  if (!text) return res.status(400).json({ error:'text_required' });
  const t = enqueue(String(text), String(source||'api'), req.session?.uid);
  res.json({ ok:true, task: t });
});
export default r;
