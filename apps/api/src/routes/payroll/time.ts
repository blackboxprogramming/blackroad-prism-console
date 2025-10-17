import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/payroll/time.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/payroll',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/time/log',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/time/recent',(req,res)=>{ const id=String(req.query.employeeId||''); const items=read().reverse().filter((x:any)=>!id||x.employeeId===id).slice(0,200); res.json({ items }); });
export default r;
