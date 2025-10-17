import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../lib/db.js';
const r = Router();

// Create or update app
r.post('/app', async (req,res)=>{
  const { partnerId, name, slug, scopes, webhookUrl } = req.body || {};
  if (!partnerId || !name || !slug || !scopes) return res.status(400).json({ error:'missing_fields' });
  const clientId = crypto.randomBytes(12).toString('hex');
  const clientSecret = crypto.randomBytes(24).toString('hex');
  const app = await prisma.partnerApp.create({ data:{ partnerId, name, slug, scopes, webhookUrl, clientId, clientSecret } });
  res.json({ ok:true, app });
});

// Toggle visibility/approval
r.post('/app/:id/approve', async (req,res)=>{
  const app = await prisma.partnerApp.update({ where:{ id:String(req.params.id) }, data:{ approved:true, visible:true } });
  res.json({ ok:true, app });
});

export default r;
