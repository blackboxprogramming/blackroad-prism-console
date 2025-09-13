import { Router } from 'express';
import { prisma } from '../../src/lib/db.js';
import { auditAppend } from '../../src/lib/audit.js';
const r = Router();

r.post('/', async (req:any, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error:'token_required' });
  const inv = await prisma.invite.findUnique({ where: { token } });
  if (!inv) return res.status(404).json({ error:'not_found' });
  if (new Date() > inv.expiresAt) return res.status(410).json({ error:'expired' });
  // Attach current user to org
  if (!req.session?.uid) return res.status(401).json({ error:'login_required' });
  await prisma.membership.create({ data: { orgId: inv.orgId, userId: req.session.uid, role: inv.role } });
  await prisma.invite.update({ where:{ token }, data:{ acceptedBy: req.session.uid } });
  auditAppend(inv.orgId, 'org.accept_invite', { by: req.session.uid });
  res.json({ ok:true, orgId: inv.orgId, role: inv.role });
});

export default r;
