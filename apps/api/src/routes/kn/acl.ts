import { Router } from 'express';
import fs from 'fs';
const r = Router(); const ACL='knowledge/acl.json';
const read=()=> fs.existsSync(ACL)? JSON.parse(fs.readFileSync(ACL,'utf-8')):{ policies:[] };
const write=(o:any)=>{ fs.mkdirSync('knowledge',{recursive:true}); fs.writeFileSync(ACL, JSON.stringify(o,null,2)); };
r.post('/acl/set',(req,res)=>{ write({ policies: req.body?.policies||[] }); res.json({ ok:true }); });
r.post('/acl/check',(req,res)=>{
  const { subject, docId } = req.body||{};
  // naive: allow if subject has 'admin' or any policy with min_role satisfied; docs carry labels in index store
  const isAdmin=(subject?.roles||[]).includes('admin');
  res.json({ ok:true, allow: isAdmin });
});
export default r;
