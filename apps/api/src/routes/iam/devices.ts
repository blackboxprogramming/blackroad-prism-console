import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='iam/devices.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ devices:{} };
const write=(o:any)=>{ fs.mkdirSync('iam',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/devices/attest',(req,res)=>{ const o=read(); const d=req.body||{}; o.devices[d.deviceId]=d; write(o); res.json({ ok:true }); });
r.get('/devices/status',(req,res)=>{ const o=read(); const id=String(req.query.deviceId||''); res.json(o.devices[id]||null); });
export default r;
