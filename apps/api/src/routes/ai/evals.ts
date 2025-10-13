import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router(); const FILE='ai/evals/suites.yaml';
r.post('/evals/suite',(req,res)=>{ const y=typeof req.body?.yaml==='string'?req.body.yaml:yaml.stringify(req.body?.yaml||req.body); fs.mkdirSync('ai/evals',{recursive:true}); fs.writeFileSync(FILE,y); res.json({ok:true}); });
export default r;
