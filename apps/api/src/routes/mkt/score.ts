import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router();
const RULES='marketing/lead_score/rules.yaml';
const STORE='data/mkt/score.json';

r.post('/score/upsert', (req,res)=>{
  const y = typeof req.body?.yaml==='string' ? req.body.yaml : yaml.stringify(req.body?.yaml||req.body);
  fs.writeFileSync(RULES, y); res.json({ ok:true });
});

r.get('/score/:subjectId', (req,res)=>{
  const obj = fs.existsSync(STORE)? JSON.parse(fs.readFileSync(STORE,'utf-8')) : {};
  res.json({ subjectId: String(req.params.subjectId), score: Number(obj[String(req.params.subjectId)]||0) });
});

export default r;
