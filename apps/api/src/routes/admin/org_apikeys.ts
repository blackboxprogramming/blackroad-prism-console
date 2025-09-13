import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../src/lib/db.js';
import { auditAppend } from '../../src/lib/audit.js';
const r = Router();

r.post('/issue', async (req:any, res) => {
  if (!req.org?.id) return res.status(400).json({ error:'org_required' });
  const key = crypto.randomBytes(24).toString('hex');
  const owner = String(req.body?.owner || 'service');
  const out = await prisma.apiKey.create({ data:{ key, owner, orgId: req.org.id } });
  auditAppend(req.org.id, 'org.key_issue', { by: req.session?.uid, owner });
  res.json({ ok:true, key: out });
});

r.post('/revoke', async (req:any, res) => {
  const { id } = req.body || {};
  const k = await prisma.apiKey.update({ where:{ id: String(id||'') }, data:{ revokedAt: new Date() }});
  auditAppend(k.orgId, 'org.key_revoke', { by: req.session?.uid, id });
  res.json({ ok:true });
});

r.get('/list', async (req:any, res) => {
  if (!req.org?.id) return res.status(400).json({ error:'org_required' });
  const keys = await prisma.apiKey.findMany({ where:{ orgId: req.org.id }});
  res.json({ ok:true, keys });
});

export default r;
