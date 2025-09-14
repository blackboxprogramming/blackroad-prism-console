
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='crm/contacts.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ contacts:{} };
const write=(o:any)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/contacts/upsert',(req,res)=>{ const o=read(); const c=req.body||{}; o.contacts[c.id]=c; write(o); res.json({ ok:true }); });
export default r;

