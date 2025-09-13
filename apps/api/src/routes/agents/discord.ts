import { Router } from 'express';
import { enqueue } from '../../../../agents/command_bus.js';
const r = Router();
r.post('/', (req:any, res) => {
  const text = String(req.body?.content||'');
  const t = enqueue(text, 'discord', req.body?.author?.id);
  res.json({ ok:true, task: t });
});
export default r;
