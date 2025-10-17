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
  if (!req.org?.id) return res.status(400).json({ error:'org_required' });
  const { id } = req.body || {};
  const keyId = String(id || '');
  if (!keyId) return res.status(400).json({ error:'id_required' });
  const key = await prisma.apiKey.findFirst({ where:{ id: keyId, orgId: req.org.id } });
  if (!key) return res.status(404).json({ error:'not_found' });
  await prisma.apiKey.update({ where:{ id: key.id }, data:{ revokedAt: new Date() }});
  auditAppend(req.org.id, 'org.key_revoke', { by: req.session?.uid, id: key.id });
  res.json({ ok:true });
});

r.get('/list', async (req:any, res) => {
  if (!req.org?.id) return res.status(400).json({ error:'org_required' });
  const keys = await prisma.apiKey.findMany({ where:{ orgId: req.org.id }});
  res.json({ ok:true, keys });
});

export default r;
