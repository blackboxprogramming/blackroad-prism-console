
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='crm/quotas.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ quotas:{} };
const write=(o:any)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/quotas/set',(req,res)=>{ const o=read(); const p=req.body?.period||''; o.quotas[p]=req.body?.reps||[]; write(o); res.json({ ok:true }); });
r.get('/quotas/:period',(req,res)=>{ const o=read(); res.json(o.quotas[String(req.params.period)]||[]); });
export default r;

