import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DIR='data/payroll/tax_files';
r.post('/forms/941',(req,res)=>{ const { year, quarter }=req.body||{}; fs.mkdirSync(DIR,{recursive:true}); const f=`${DIR}/F941_${year}_Q${quarter}.txt`; fs.writeFileSync(f, `941 stub ${year} Q${quarter}\n`); res.json({ ok:true, file:f }); });
r.post('/forms/w2',(req,res)=>{ const { year }=req.body||{}; fs.mkdirSync(DIR,{recursive:true}); const f=`${DIR}/W2_${year}.txt`; fs.writeFileSync(f, `W2 stub ${year}\n`); res.json({ ok:true, file:f }); });
r.get('/forms/recent',(_req,res)=>{ const files=fs.existsSync(DIR)? fs.readdirSync(DIR).sort().reverse().slice(0,20):[]; res.json({ files }); });
export default r;

