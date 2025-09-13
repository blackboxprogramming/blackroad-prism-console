import { Router } from 'express';
import fs from 'fs';
const r = Router();
const store = 'data/privacy/preferences.json';

r.post('/preferences/set', (req,res)=>{
  const { subjectId, key, value } = req.body || {};
  if (!subjectId || !key) return res.status(400).json({ error:'bad_request' });
  const obj = fs.existsSync(store) ? JSON.parse(fs.readFileSync(store,'utf-8')) : {};
  obj[subjectId] ||= {}; obj[subjectId][key] = value;
  fs.mkdirSync('data/privacy',{recursive:true}); fs.writeFileSync(store, JSON.stringify(obj,null,2));
  res.json({ ok:true });
});

export default r;
