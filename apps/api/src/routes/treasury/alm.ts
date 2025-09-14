import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/treasury/alm_schedule.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ asset:[], liability:[] };
const write=(o:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/alm/schedule',(req,res)=>{ const o=read(); const side=req.body?.side; o[side]=req.body?.items||[]; write(o); res.json({ ok:true }); });
r.get('/alm/gap',(_req,res)=>{ const o=read(); const gap={ '0-30d':0,'31-90d':0,'91-365d':0,'365d+':0 }; res.json({ gap, schedule:o }); });

export default r;
