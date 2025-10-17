import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();

r.post('/uninstall', async (req,res)=>{
  const { installId } = req.body || {};
  if (!installId) return res.status(400).json({ error:'installId_required' });
  const t = await prisma.appInstall.update({ where:{ id:String(installId) }, data:{ uninstalledAt: new Date() }});
  res.json({ ok:true, uninstall: t.id });
});

export default r;
