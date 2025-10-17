import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='payroll/employees.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ employees:{} };
const write=(o:any)=>{ fs.mkdirSync('payroll',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/employees/upsert',(req,res)=>{ const o=read(); const e=req.body||{}; o.employees[e.id]=e; write(o); res.json({ ok:true }); });
r.get('/employees/:id',(req,res)=>{ const o=read(); res.json(o.employees[String(req.params.id)]||null); });

export default r;

