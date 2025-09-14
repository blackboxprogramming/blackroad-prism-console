import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='mdm/rules.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ rules:{} };
const write=(o:any)=>{ fs.mkdirSync('mdm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/rules/set',(req,res)=>{ const o=read(); const d=req.body?.domain||''; o.rules[d]=req.body||{}; write(o); res.json({ ok:true }); });
r.get('/rules/:domain',(req,res)=>{ const o=read(); res.json(o.rules[String(req.params.domain)]||{}); });
export default r;
