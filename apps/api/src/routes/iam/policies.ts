import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='iam/policies.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ version:'v1', roles:[], rules:[] };
const write=(o:any)=>{ fs.mkdirSync('iam',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/policies/set',(req,res)=>{ write(req.body||read()); res.json({ ok:true }); });
r.get('/policies',(_req,res)=> res.json(read()));
export default r;
