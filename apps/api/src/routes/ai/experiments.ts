import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const IDX='ai/experiments/index.json';
const read=()=> fs.existsSync(IDX)? JSON.parse(fs.readFileSync(IDX,'utf-8')):{ list:[] };
const write=(o:any)=> { fs.mkdirSync('ai/experiments',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify(o,null,2)); };

r.post('/experiments/create',(req,res)=>{
  const { name, variants, datasetKey } = req.body||{};
  const o=read(); const id=uuid(); o.list.push({ id, name, variants:variants||[], datasetKey, createdAt: Date.now() }); write(o); res.json({ ok:true, id });
});

r.post('/experiments/run',(req,res)=>{
  const { id } = req.body||{}; const o=read(); const e=o.list.find((x:any)=>x.id===id); if(!e) return res.status(404).json({error:'not_found'});
  fs.mkdirSync('ai/experiments/results',{recursive:true}); fs.writeFileSync(`ai/experiments/results/${id}.json`, JSON.stringify({ id, ranAt: Date.now(), summary:'stub' },null,2));
  res.json({ ok:true });
});

export default r;
