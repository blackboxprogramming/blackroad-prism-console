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
  if (inv.acceptedBy) return res.status(409).json({ error:'already_accepted' });
  // Attach current user to org
  if (!req.session?.uid) return res.status(401).json({ error:'login_required' });
  const userId = req.session.uid;
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.invite.updateMany({
        where:{ token, acceptedBy: null },
        data:{ acceptedBy: userId },
      });
      if (!updated.count) throw new Error('invite_used');
      await tx.membership.create({ data: { orgId: inv.orgId, userId, role: inv.role } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'invite_used') {
      return res.status(409).json({ error:'already_accepted' });
    }
    throw err;
  }
  auditAppend(inv.orgId, 'org.accept_invite', { by: req.session.uid });
  res.json({ ok:true, orgId: inv.orgId, role: inv.role });
});

export default r;
