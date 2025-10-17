import { Router } from 'express';
import { prisma } from '../../src/lib/db.js';
import { auditAppend } from '../../src/lib/audit.js';
const r = Router();

r.post('/', async (req:any, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error:'name_required' });
  const org = await prisma.organization.create({ data: { name } });
  // creator becomes owner (if logged in)
  if (req.session?.uid) {
    await prisma.membership.create({ data: { orgId: org.id, userId: req.session.uid, role: 'owner' } });
  }
  auditAppend(org.id, 'org.create', { by: req.session?.uid || 'system', name });
  res.json({ ok:true, org });
});

export default r;
