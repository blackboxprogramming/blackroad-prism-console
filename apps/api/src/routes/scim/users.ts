import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();

function guard(req:any,res:any,next:any){
  const hdr = String(req.headers.authorization||'');
  if (hdr !== `Bearer ${process.env.SCIM_BEARER_TOKEN}`) return res.status(401).json({ error:'unauthorized' });
  next();
}
r.use(guard);

r.get('/Users', async (_req,res)=> {
  const users = await prisma.user.findMany({ select: { id:true, email:true, name:true }});
  res.json({ Resources: users.map(u=>({ id:u.id, userName:u.email, name:{ formatted:u.name||u.email } })), totalResults: users.length, itemsPerPage: users.length, startIndex: 1, schemas:["urn:ietf:params:scim:api:messages:2.0:ListResponse"] });
});

r.post('/Users', async (req:any,res)=> {
  const email = req.body?.userName || req.body?.email;
  const name  = req.body?.name?.formatted || '';
  const u = await prisma.user.upsert({ where:{ email }, update:{ name }, create:{ email, name }});
  res.status(201).json({ id: u.id, userName: u.email, active: true, name: { formatted: u.name||u.email }});
});

r.get('/Users/:id', async (req,res)=> {
  const u = await prisma.user.findUnique({ where:{ id:String(req.params.id) }});
  if (!u) return res.status(404).json({ error:'not_found' });
  res.json({ id:u.id, userName:u.email, active:true, name:{ formatted:u.name||u.email }});
});

r.delete('/Users/:id', async (req,res)=> {
  try { await prisma.user.delete({ where:{ id:String(req.params.id) }}); } catch {}
  res.status(204).end();
});

export default r;
