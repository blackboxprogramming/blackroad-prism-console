import { Router } from 'express';
import fs from 'fs';
const r = Router(); const PMT='data/tax/payments.jsonl', DIR='data/tax/files';
const read=()=> fs.existsSync(PMT)? fs.readFileSync(PMT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/1099/generate',(req,res)=>{ const year=String(req.body?.year||''); const file=`${DIR}/1099_${year}.txt`; fs.mkdirSync(DIR,{recursive:true}); fs.writeFileSync(file, `1099 file for ${year}\n`); res.json({ok:true,file}); });
r.post('/1042s/generate',(req,res)=>{ const year=String(req.body?.year||''); const file=`${DIR}/1042S_${year}.txt`; fs.mkdirSync(DIR,{recursive:true}); fs.writeFileSync(file, `1042-S file for ${year}\n`); res.json({ok:true,file}); });
r.get('/files/recent',(_req,res)=>{ const files=fs.existsSync(DIR)? fs.readdirSync(DIR).sort().reverse().slice(0,10):[]; res.json({files}); });
export default r;
