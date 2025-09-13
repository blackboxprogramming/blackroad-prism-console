import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();

r.post('/revoke', async (req,res)=>{
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error:'token_required' });
  try{
    await prisma.oAuthToken.delete({ where:{ accessToken:String(token) }});
  } catch {}
  res.json({ ok:true });
});

export default r;
