import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();

r.get('/list', async (_req,res)=>{
  const apps = await prisma.partnerApp.findMany({ where:{ visible: true, approved: true }, select:{ id:true, name:true, slug:true, scopes:true }});
  res.json({ apps });
});

r.get('/app/:slug', async (req,res)=>{
  const app = await prisma.partnerApp.findFirst({ where:{ slug: String(req.params.slug), visible:true, approved:true }});
  if (!app) return res.status(404).json({ error:'not_found' });
  res.json({ app });
});

export default r;
