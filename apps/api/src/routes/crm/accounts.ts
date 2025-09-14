
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='crm/accounts.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ accounts:{} };
const write=(o:any)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/accounts/upsert',(req,res)=>{ const o=read(); const a=req.body||{}; o.accounts[a.id]=a; write(o); res.json({ ok:true }); });
export default r;

