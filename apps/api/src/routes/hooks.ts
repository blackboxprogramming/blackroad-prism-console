import { Router } from 'express';
const r = Router();

r.post('/github', (req, res) => {
  const event = req.get('X-GitHub-Event') || 'unknown';
  const id = req.get('X-GitHub-Delivery') || 'n/a';
  console.log(`[webhook] ${event} id=${id}`);
  // TODO: validate signature; emit analytics event
  res.sendStatus(204);
});

export default r;
