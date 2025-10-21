
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='crm/stages.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ stages:[], methodology:'Custom' };
const write=(o:any)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/stages/set',(req,res)=>{ write({ stages: req.body?.stages||[], methodology: req.body?.methodology||'Custom' }); res.json({ ok:true }); });
r.get('/stages',(_req,res)=> res.json(read()));
export default r;

