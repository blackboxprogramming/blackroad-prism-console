import { Router } from 'express';
import fs from 'fs';
const r = Router(); const BASE='cmdb/baselines.json', DRIFT='data/cmdb/drift.jsonl', DISC='data/cmdb/discovery.jsonl';
const baseread=()=> fs.existsSync(BASE)? JSON.parse(fs.readFileSync(BASE,'utf-8')):{ baselines:{} };
const basewrite=(o:any)=>{ fs.mkdirSync('cmdb',{recursive:true}); fs.writeFileSync(BASE, JSON.stringify(o,null,2)); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const append=(row:any)=>{ fs.mkdirSync('data/cmdb',{recursive:true}); fs.appendFileSync(DRIFT, JSON.stringify(row)+'\n'); };

r.post('/baseline/set',(req,res)=>{ const o=baseread(); o.baselines[req.body?.ciId||'']=req.body?.baseline||{}; basewrite(o); res.json({ ok:true }); });

r.post('/drift/scan',(req,res)=>{
  const ciId=String(req.body?.ciId||''); const baseline=baseread().baselines?.[ciId]||{};
  const lastDisc=lines(DISC).reverse().find((x:any)=> (x.items||[]).some((i:any)=>i.ciId===ciId));
  const discItem = (lastDisc?.items||[]).find((i:any)=>i.ciId===ciId) || {};
  const diff={ attrs:{}, rels:[] as any[] };
  const attrs=Object.assign({}, baseline.attrs||{});
  for(const k of Object.keys({...baseline.attrs, ...(discItem.attrs||{})})){ if(JSON.stringify((baseline.attrs||{})[k])!==JSON.stringify((discItem.attrs||{})[k])) diff.attrs[k]={expected:(baseline.attrs||{})[k],observed:(discItem.attrs||{})[k]}; }
  append({ ts:Date.now(), ciId, diff });
  res.json({ ok:true, diff });
});

r.get('/drift/recent',(req,res)=>{ const ciId=String(req.query.ciId||''); const items=lines(DRIFT).reverse().filter((x:any)=>!ciId||x.ciId===ciId).slice(0,50); res.json({ items }); });

export default r;
