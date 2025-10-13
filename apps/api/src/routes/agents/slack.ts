import { Router } from 'express';
import crypto from 'node:crypto';
import { enqueue } from '../../../../agents/command_bus.js';
const r = Router();

function verify(req:any){
  const sig = req.headers['x-slack-signature']||'';
  const ts  = req.headers['x-slack-request-timestamp']||'';
  const base = `v0:${ts}:${req.rawBody}`;
  const mac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET||'').update(base).digest('hex');
  return `v0=${mac}` === sig;
}

r.post('/', (req:any, res) => {
  try{
    if (!verify(req)) return res.status(401).send('bad sig');
    const text = String(req.body?.text||'').trim();
    const t = enqueue(text, 'slack', req.body?.user_id);
    res.json({ response_type: 'ephemeral', text: `Queued: ${t.intent} (${t.id})` });
  }catch{ res.status(400).send('bad'); }
});

export default r;
