import { Router } from 'express';
import { hasScope } from '../middleware/auth.js';
import { signPayload } from '../../lib/hmac.js';

const router = Router();

router.post('/test-delivery', (req, res) => {
  if (!hasScope(req, 'deploy:write') && !hasScope(req, 'media:write') && !hasScope(req, 'sim:write')) {
    res.status(403).json({ error: { code: 'forbidden', message: 'write scope required for test delivery' } });
    return;
  }

  const { callbackUrl, eventType } = req.body ?? {};
  if (!callbackUrl || !eventType) {
    res.status(400).json({ error: { code: 'invalid_request', message: 'callbackUrl and eventType are required' } });
    return;
  }

  const payload = {
    eventId: `evt_${Date.now()}`,
    type: eventType,
    occurredAt: new Date().toISOString(),
    data: { example: true },
  };
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(JSON.stringify(payload), process.env.BLACKROAD_SHARED_SECRET ?? 'development-secret', timestamp);

  res.status(202).json({
    scheduled: true,
    preview: {
      callbackUrl,
      payload,
      headers: {
        'X-BlackRoad-Timestamp': timestamp,
        'X-BlackRoad-Signature': signature,
      },
    },
  });
});

export default router;
