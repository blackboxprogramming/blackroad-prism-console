import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CIS='cmdb/cis.json', DISC='data/cmdb/discovery.jsonl';
const read=()=> fs.existsSync(CIS)? JSON.parse(fs.readFileSync(CIS,'utf-8')):{ cis:{} };
const write=(o:any)=>{ fs.mkdirSync('cmdb',{recursive:true}); fs.writeFileSync(CIS, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/cmdb',{recursive:true}); fs.appendFileSync(DISC, JSON.stringify(row)+'\n'); };

r.post('/ci/upsert',(req,res)=>{ const o=read(); const c=req.body||{}; o.cis[c.ciId]=c; write(o); res.json({ ok:true }); });
r.get('/ci/:ciId',(req,res)=>{ const o=read(); res.json(o.cis[String(req.params.ciId)]||null); });

r.post('/discovery/ingest',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });

r.get('/graph',(req,res)=>{
  const type=String(req.query.type||'service'); const o=read().cis||{};
  const nodes=Object.values(o).filter((ci:any)=>!type||ci.type===type).map((ci:any)=>({id:ci.ciId,type:ci.type,name:ci.name,env:ci.env||''}));
  const edges: any[]=[];
  for(const ci of Object.values(o) as any[]){
    for(const rel of (ci.rels||[])){ edges.push({from:ci.ciId,to:rel.to,type:rel.type}); }
  }
  res.json({ nodes, edges });
});

export default r;
