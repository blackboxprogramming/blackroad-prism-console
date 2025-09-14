import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='sox/rcm/rcm.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ processes:{} };
const write=(o:any)=>{ fs.mkdirSync('sox/rcm',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/rcm/upsert',(req,res)=>{
  const { processId, risks, controls } = req.body||{};
  const o=read(); o.processes[processId]={ processId, risks:risks||[], controls:controls||[] }; write(o); res.json({ ok:true });
});

r.get('/rcm/:processId',(req,res)=>{
  const o=read(); const p=o.processes[String(req.params.processId)]; if(!p) return res.status(404).json({error:'not_found'}); res.json(p);
});

export default r;
