import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();

r.post('/install', async (req:any,res)=>{
  const { appId, orgId } = req.body || {};
  if (!appId || !orgId) return res.status(400).json({ error:'missing_fields' });
  const installed = await prisma.appInstall.create({ data:{ appId, orgId } });
  res.json({ ok:true, install: installed });
});

export default r;
