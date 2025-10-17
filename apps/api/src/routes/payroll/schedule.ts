import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='payroll/schedule.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ policy:'semimonthly', pay_dates:[] };
const write=(o:any)=>{ fs.mkdirSync('payroll',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/schedule/set',(req,res)=>{ const p=req.body||{}; write({ policy:p.policy||'semimonthly', pay_dates:p.pay_dates||[] }); res.json({ ok:true }); });
export default r;

