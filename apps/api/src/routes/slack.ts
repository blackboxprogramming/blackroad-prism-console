import { Router } from 'express';
import crypto from 'node:crypto';

const r = Router();

function verifySlack(req: any, rawBody: Buffer, secret: string) {
  const timestamp = req.get('X-Slack-Request-Timestamp') || '';
  const signature = req.get('X-Slack-Signature') || '';
  const base = `v0:${timestamp}:${rawBody.toString()}`;
  const hmac = crypto.createHmac('sha256', secret).update(base).digest('hex');
  const expected = `v0=${hmac}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch { return false; }
}

r.post('/commands', (req: any, res) => {
  const secret = process.env.SLACK_SIGNING_SECRET || '';
  if (!req.rawBody || !verifySlack(req, req.rawBody, secret)) return res.status(401).send('bad sig');

  const text: string = req.body?.text || '';
  const cmd = (req.body?.command || '').trim();

  if (cmd === '/deploy') {
    // fire-and-forget: GitHub dispatch or call deploy hook (placeholder)
    res.json({ response_type: 'ephemeral', text: 'Deploy started… (watch Slack for updates)' });
    return;
  }

  if (cmd === '/status') {
    res.json({ response_type: 'ephemeral', text: 'API healthy: /api/health, metrics at /api/metrics' });
    return;
  }

  res.json({ response_type: 'ephemeral', text: `Unknown command ${cmd} ${text}` });
});

export default r;
