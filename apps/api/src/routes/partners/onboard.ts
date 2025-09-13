import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();

r.post('/partner', async (req,res)=>{
  const { name, email, website } = req.body || {};
  if (!name || !email) return res.status(400).json({ error:'name_email_required' });
  const p = await prisma.partner.create({ data:{ name, email, website, status:'pending' } });
  res.json({ ok:true, partner:p });
});

export default r;
