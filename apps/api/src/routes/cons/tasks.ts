import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cons/tasks.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ periods:{} };
const write=(o:any)=>{ fs.mkdirSync('cons',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/tasks/upsert',(req,res)=>{ const o=read(); o.periods[req.body?.period||'']={ tasks: req.body?.tasks||[] }; write(o); res.json({ ok:true }); });
r.get('/tasks/:period',(req,res)=>{ const o=read(); res.json(o.periods[String(req.params.period)]||{ tasks:[] }); });

export default r;
