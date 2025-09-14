import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CFG='exp/approvals.json', LOG='data/exp/approvals.jsonl', E='exp/experiments.json';
const readCfg=()=> fs.existsSync(CFG)? JSON.parse(fs.readFileSync(CFG,'utf-8')):{ rules:[{field:'guardrails.err_rate_max',required:true,role:'Risk'}] };
const writeCfg=(o:any)=>{ fs.mkdirSync('exp',{recursive:true}); fs.writeFileSync(CFG, JSON.stringify(o,null,2)); };
const exps=()=> fs.existsSync(E)? JSON.parse(fs.readFileSync(E,'utf-8')).experiments||{}:{};
const append=(row:any)=>{ fs.mkdirSync('data/exp',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };

r.post('/approvals/route',(req,res)=>{
  const id=String(req.body?.expId||''); const exp=exps()[id]||{};
  const cfg=readCfg(); const unmet = (cfg.rules||[]).filter((r:any)=> r.required && String(r.field).split('.').reduce((acc:any,k:string)=> acc?.[k], exp)==null );
  const steps = unmet.length? unmet.map((r:any)=>({role:r.role,status:'pending'})) : [{role:'Owner',status:'approved'}];
  append({ ts:Date.now(), expId:id, steps }); res.json({ ok:true, steps });
});

r.get('/approvals/status/:expId',(req,res)=>{
  const id=String(req.params.expId); const rows= fs.existsSync(LOG)? fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.expId===id).slice(-1):[];
  res.json(rows[0]||{steps:[]});
});

export default r;
