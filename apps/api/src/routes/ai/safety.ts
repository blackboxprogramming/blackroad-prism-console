import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router(); const FILE='ai/safety/policies.yaml';
r.post('/safety/policy',(req,res)=>{ const y=typeof req.body?.key==='string' ? yaml.stringify({[req.body.key]: req.body.yaml}) : yaml.stringify(req.body); fs.mkdirSync('ai/safety',{recursive:true}); fs.writeFileSync(FILE,y); res.json({ok:true}); });
r.get('/safety/policies',(_req,res)=>{ const y=fs.existsSync(FILE)?yaml.parse(fs.readFileSync(FILE,'utf-8')):{}; res.json(y||{}); });
export default r;
