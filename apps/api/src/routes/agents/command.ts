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
import { enqueue } from '../../../../agents/command_bus.ts';

const router = Router();

router.post('/', (req: any, res) => {
  const { text, source, approval } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'text_required' });
  }

  const approvalHeaders = {
    runId: req.headers['x-approval-run-id'],
    token: req.headers['x-approval-token'],
  };

  try {
    const task = enqueue(String(text), {
      source: String(source || 'api'),
      user: req.session?.uid,
      approval: approval || approvalHeaders,
    });
    return res.json({ ok: true, task });
  } catch (error: any) {
    if (error?.name === 'ApprovalRequiredError') {
      return res.status(403).json({ error: 'approval_required' });
    }
    return res.status(400).json({ error: 'invalid_command' });
  }
});

export default router;
