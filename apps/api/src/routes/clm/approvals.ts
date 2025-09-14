import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CFG='clm/approvals.json', LOG='data/clm/approvals.jsonl', CON='data/clm/contracts.jsonl';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/clm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/approvals/matrix/set',(req,res)=>{ write(CFG, req.body||{steps:[]}); res.json({ ok:true }); });
r.post('/approvals/route',(req,res)=>{
  const cfg=read(CFG,{steps:[]}); const id=String(req.body?.contractId||''); const c=lines(CON).reverse().find((x:any)=>x.contractId===id)||{};
  const routed=cfg.steps.filter((s:any)=> !s.condition || (s.condition.op==='contains' ? String(c.fields?.[s.condition.field]||'').includes(String(s.condition.value)) : true));
  append(LOG,{ ts:Date.now(), contractId:id, routed }); res.json({ ok:true, steps:routed });
});
r.get('/approvals/status/:contractId',(req,res)=>{ const id=String(req.params.contractId); const it=lines(LOG).reverse().find((x:any)=>x.contractId===id)||{routed:[]}; res.json(it); });
export default r;
