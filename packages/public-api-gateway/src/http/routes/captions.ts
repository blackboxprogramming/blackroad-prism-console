import { Router } from 'express';
import { hasScope } from '../middleware/auth.js';
import { emitAuditEvent } from '../../lib/otel.js';

const router = Router();

const jobs = new Map<string, { status: string; artifacts: { type: string; url: string }[] }>();

router.post('/', (req, res) => {
  if (!hasScope(req, 'media:write')) {
    res.status(403).json({ error: { code: 'forbidden', message: 'media:write scope required' } });
    return;
  }

  const jobId = `job_${Date.now()}`;
  jobs.set(jobId, { status: 'processing', artifacts: [] });
  emitAuditEvent({
    actor: req.auth?.actor?.id ?? 'unknown',
    action: 'caption.create',
    subject: jobId,
    metadata: req.body,
  });
  res.status(202).json({ jobId, status: 'processing', estimatedCompletionSeconds: 120 });
});

router.get('/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: { code: 'not_found', message: 'Job not found' } });
    return;
  }
  res.json({ jobId: req.params.jobId, status: job.status, submittedAt: new Date().toISOString(), artifacts: job.artifacts });
});

router.get('/:jobId/artifacts', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: { code: 'not_found', message: 'Job not found' } });
    return;
  }
  res.json({ jobId: req.params.jobId, artifacts: job.artifacts });
});

export default router;
