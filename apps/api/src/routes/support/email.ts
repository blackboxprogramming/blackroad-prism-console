import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'fs';
const r = Router();

function verify(req:any){
  const secret = process.env.SUPPORT_EMAIL_PARSER_SECRET || '';
  const sig = String(req.headers['x-parser-signature']||'');
  const mac = crypto.createHmac('sha256', secret).update(req.rawBody||'').digest('hex');
  return sig === mac;
}

r.post('/email/ingest', (req:any,res)=>{
  if (!verify(req)) return res.status(401).send('bad_sig');
  const payload = req.body||{};
  const subject = payload.subject || '(no subject)';
  const body = payload.text || payload.html || '';
  const requester = payload.from || 'unknown';
  // Defer to tickets route via file append
  const FILE='data/support/tickets.jsonl';
  const row = { id: crypto.randomUUID(), ts: Date.now(), subject, body, requester, channel:'email', status:'open', assignee:'', tags:['email'] };
  fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n');
  res.json({ ok:true, id: row.id });
});

export default r;
