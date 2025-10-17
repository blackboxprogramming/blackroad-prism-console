import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../src/lib/db.js';
import { inviteEmail } from '../../src/lib/email_templates.js';
import { auditAppend } from '../../src/lib/audit.js';

const r = Router();
r.post('/', async (req:any, res) => {
  if (!req.org?.id) return res.status(400).json({ error:'org_required' });
  const { email, role } = req.body || {};
  if (!email) return res.status(400).json({ error:'email_required' });
  const token = crypto.randomBytes(16).toString('hex');
  const exp = new Date(Date.now()+7*86400000);
  await prisma.invite.create({ data: { email, token, orgId: req.org.id, role: String(role||'member'), expiresAt: exp } });
  const org = await prisma.organization.findUnique({ where:{ id: req.org.id }});
  const msg = inviteEmail(org?.name || 'BlackRoad', token);
  // send via notify endpoint (best-effort)
  await fetch('http://localhost:4000/api/notify/send',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channel:'email', to: email, subject: msg.subject, message: msg.text }) }).catch(()=>null);
  auditAppend(req.org.id, 'org.invite', { by: req.session?.uid, email, role });
  res.json({ ok:true, token });
});

export default r;
