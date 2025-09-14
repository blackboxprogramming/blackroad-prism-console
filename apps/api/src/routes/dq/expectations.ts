import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router(); const FILE='dq/expectations/library.yaml';
r.post('/expectations/upsert',(req,res)=>{ const y=typeof req.body?.yaml==='string'?req.body.yaml:yaml.stringify(req.body?.yaml||req.body); fs.mkdirSync('dq/expectations',{recursive:true}); fs.writeFileSync(FILE,y); res.json({ok:true}); });
r.get('/expectations/list',(_req,res)=>{ const y=fs.existsSync(FILE)?yaml.parse(fs.readFileSync(FILE,'utf-8')):{}; res.json(y||{}); });
export default r;
