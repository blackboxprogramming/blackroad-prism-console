import { Router } from 'express';
import { prisma } from '../../lib/db.js';
const r = Router();
function guard(req:any,res:any,next:any){
  const hdr = String(req.headers.authorization||'');
  if (hdr !== `Bearer ${process.env.SCIM_BEARER_TOKEN}`) return res.status(401).json({ error:'unauthorized' });
  next();
}
r.use(guard);

r.get('/Groups', async (_req,res)=>{
  const orgs = await prisma.organization.findMany({ select:{ id:true, name:true }});
  res.json({ Resources: orgs.map(o=>({ id:o.id, displayName:o.name })), totalResults: orgs.length, itemsPerPage: orgs.length, startIndex: 1, schemas:["urn:ietf:params:scim:api:messages:2.0:ListResponse"] });
});

export default r;
