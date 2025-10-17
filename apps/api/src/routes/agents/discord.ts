import { Router } from 'express';
import { enqueue } from '../../../../agents/command_bus.js';
const r = Router();
r.post('/', (req:any, res) => {
  const text = String(req.body?.content||'');
  const t = enqueue(text, 'discord', req.body?.author?.id);
  res.json({ ok:true, task: t });
});
export default r;
import { enqueue } from '../../../../agents/command_bus.ts';

const router = Router();

router.post('/', (req: any, res) => {
  try {
    const text = String(req.body?.content || '');
    const task = enqueue(text, {
      source: 'discord',
      user: req.body?.author?.id,
      approval: req.body?.approval,
    });
    res.json({ ok: true, task });
  } catch (error: any) {
    if (error?.name === 'ApprovalRequiredError') {
      return res.status(403).json({ error: 'approval_required' });
    }
    res.status(400).json({ error: 'invalid_command' });
  }
});

export default router;
