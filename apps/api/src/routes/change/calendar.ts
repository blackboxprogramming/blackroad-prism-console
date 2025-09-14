import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CAL='change/calendar.json';
const read=()=> fs.existsSync(CAL)? JSON.parse(fs.readFileSync(CAL,'utf-8')):{ periods:{} };
const write=(o:any)=>{ fs.mkdirSync('change',{recursive:true}); fs.writeFileSync(CAL, JSON.stringify(o,null,2)); };
r.post('/calendar/upsert',(req,res)=>{ const o=read(); const p=req.body?.period||''; o.periods[p]=req.body; write(o); res.json({ ok:true }); });
r.get('/calendar/:period',(req,res)=>{ const o=read(); res.json(o.periods[String(req.params.period)]||{ freezes:[], maint_windows:[] }); });
export default r;
