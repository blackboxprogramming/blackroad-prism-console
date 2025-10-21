
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='crm/territories.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ rules:[] };
const write=(o:any)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/territories/set',(req,res)=>{ write({ rules: req.body?.rules||[] }); res.json({ ok:true }); });
export default r;

