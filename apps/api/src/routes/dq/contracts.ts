import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='dq/contracts/contracts.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ list:[] };
const write=(o:any)=> { fs.mkdirSync('dq/contracts',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/contracts/upsert',(req,res)=>{
  const { dataset, producer, consumer, schemaName, obligations } = req.body||{};
  const o=read(); const i=o.list.findIndex((x:any)=>x.dataset===dataset);
  const row={ dataset, producer, consumer, schemaName, obligations: obligations||{}, updatedAt: Date.now() };
  if (i>=0) o.list[i]=row; else o.list.push(row); write(o); res.json({ ok:true });
});

r.get('/contracts/:dataset',(req,res)=>{
  const o=read(); const it=o.list.find((x:any)=>x.dataset===String(req.params.dataset)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it);
});

export default r;
