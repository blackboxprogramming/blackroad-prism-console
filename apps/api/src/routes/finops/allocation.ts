import { Router } from 'express';
import fs from 'fs';
const r = Router(); const RULE='finops/alloc_rules.json', COST='data/finops/cost.jsonl', OUT='data/finops/allocations.jsonl';
const read=(p:string)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):{};
const readLines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/finops',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/allocation/rules/set',(req,res)=>{ fs.mkdirSync('finops',{recursive:true}); fs.writeFileSync(RULE, JSON.stringify(req.body||{},null,2)); res.json({ ok:true }); });

r.post('/allocation/run',(req,res)=>{
  const period=String(req.body?.period||'');
  const rules=(read(RULE).rules||[]) as any[];
  const cost=readLines(COST).filter((x:any)=>x.period===period);
  const out:any[]=[];
  for(const row of cost){
    let cc=row.cost_center||null, prod=row.product||null, own=row.owner||row.labels?.owner||null;
    for(const r of rules){
      const m=r.match||{};
      const hit = (!m.project || m.project===row.project) &&
                  (!m.env     || m.env===row.env) &&
                  (!m.labels  || Object.entries(m.labels).every(([k,v])=> row.labels?.[k]===v));
      if(hit){ cc = r.map?.cost_center ?? cc; prod = r.map?.product ?? prod; own = r.map?.owner ?? own; }
    }
    out.push({ period, project:row.project, env:row.env, cost_center:cc, product:prod, owner:own, cost:Number(row.cost||0), currency: row.currency||'USD' });
  }
  out.forEach(o=>append(OUT,o));
  res.json({ ok:true, count: out.length });
});

r.get('/allocation/snapshot',(req,res)=>{ const p=String(req.query.period||''); if(!fs.existsSync(OUT)) return res.json({ items:[] }); const items=readLines(OUT).filter((x:any)=>!p||x.period===p).slice(-200); res.json({ items }); });
export default r;
