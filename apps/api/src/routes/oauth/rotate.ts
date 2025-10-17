import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../lib/db.js';
const r = Router();

r.post('/apps/:id/rotate-secret', async (req,res)=>{
  const id = String(req.params.id);
  const secret = crypto.randomBytes(24).toString('hex');
  const app = await prisma.partnerApp.update({ where:{ id }, data:{ clientSecret: secret }});
  res.json({ ok:true, clientId: app.clientId, clientSecret: app.clientSecret });
});

export default r;
