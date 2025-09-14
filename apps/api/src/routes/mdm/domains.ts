import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='mdm/domains.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ domains:[] };
const write=(o:any)=>{ fs.mkdirSync('mdm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/domains/set',(req,res)=>{ write({ domains: req.body?.domains||[] }); res.json({ ok:true }); });
r.get('/domains',(_req,res)=> res.json(read()));
export default r;
