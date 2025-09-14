import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cpm/drivers/trees.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ trees:{} };
const write=(o:any)=> { fs.mkdirSync('cpm/drivers',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/drivers/upsert',(req,res)=>{
  const { treeId, name, nodes } = req.body||{};
  const o=read(); o.trees[treeId]={ treeId, name, nodes: Array.isArray(nodes)?nodes:[] }; write(o);
  res.json({ ok:true });
});

r.get('/drivers/:treeId',(req,res)=>{
  const o=read(); const t=o.trees[String(req.params.treeId)]; if(!t) return res.status(404).json({error:'not_found'}); res.json(t);
});

r.post('/drivers/evaluate',(req,res)=>{
  const { treeId, assumptions } = req.body||{}; const o=read(); const t=o.trees[treeId]; if(!t) return res.status(404).json({error:'not_found'});
  const result = { output: {}, assumptions: assumptions||{} }; // stub: evaluation engine
  res.json({ ok:true, result });
});

export default r;
