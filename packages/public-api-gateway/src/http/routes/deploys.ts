import { Router } from 'express';
import { hasScope } from '../middleware/auth.js';
import { emitAuditEvent } from '../../lib/otel.js';

const router = Router();

router.post('/', (req, res) => {
  if (!hasScope(req, 'deploy:write')) {
    res.status(403).json({ error: { code: 'forbidden', message: 'deploy:write scope required' } });
    return;
  }

  const releaseId = `rel_${Date.now()}`;
  emitAuditEvent({
    actor: req.auth?.actor?.id ?? 'unknown',
    action: 'deploy.create',
    subject: releaseId,
    metadata: req.body,
  });

  res.status(201).json({ releaseId, status: 'pending', auditId: `audit_${releaseId}` });
});

router.post('/:releaseId:promote', (req, res) => {
  if (!hasScope(req, 'release:write')) {
    res.status(403).json({ error: { code: 'forbidden', message: 'release:write scope required' } });
    return;
  }

  const { releaseId } = req.params;
  emitAuditEvent({
    actor: req.auth?.actor?.id ?? 'unknown',
    action: 'release.promote',
    subject: releaseId,
    metadata: { promotion: 'requested' },
  });

  res.status(202).json({ releaseId, status: 'promoting' });
});

export default router;
