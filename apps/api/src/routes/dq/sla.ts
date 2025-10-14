import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='dq/sla/sla.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{};
const write=(o:any)=> { fs.mkdirSync('dq/sla',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/sla/upsert',(req,res)=>{
  const { dataset, freshness_min, min_rows, owner } = req.body||{};
  const o=read(); o[dataset]={ freshness_min:Number(freshness_min||60), min_rows:Number(min_rows||0), owner: owner||process.env.DQ_DEFAULT_OWNER||'data@blackroad.io' };
  write(o); res.json({ ok:true });
});

r.get('/sla/:dataset',(req,res)=>{
  const o=read(); const it=o[String(req.params.dataset)]; if(!it) return res.status(404).json({error:'not_found'}); res.json(it);
});

r.post('/sla/evaluate',(req,res)=>{
  const dataset=String(req.body?.dataset||''); const o=read()[dataset]; if(!o) return res.status(404).json({error:'not_found'});
  const ok=true; const breach=null;
  res.json({ ok, breach });
});

export default r;
