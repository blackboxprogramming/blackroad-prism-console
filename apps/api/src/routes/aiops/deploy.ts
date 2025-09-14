import { Router } from 'express';
import fs from 'fs';
const r = Router(); const STATE='aiops/deployments.json', LOG='data/aiops/deploy_events.jsonl';
const read=()=> fs.existsSync(STATE)? JSON.parse(fs.readFileSync(STATE,'utf-8')):{ envs:{} };
const write=(o:any)=>{ fs.mkdirSync('aiops',{recursive:true}); fs.writeFileSync(STATE, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/aiops',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };

r.post('/deploy/canary',(req,res)=>{
  const o=read(); const env=req.body?.env||process.env.AIOPS_DEFAULT_ENV||'prod';
  o.envs[env]=o.envs[env]||{active:null,canary:null};
  o.envs[env].canary={ modelId:req.body?.modelId, version:req.body?.version, percent:Number(req.body?.percent||process.env.AIOPS_CANARY_PERCENT||10) };
  write(o); append({ ts:Date.now(), env, event:'canary', ...o.envs[env].canary }); res.json({ ok:true });
});
r.post('/deploy/promote',(req,res)=>{
  const o=read(); const env=req.body?.env||process.env.AIOPS_DEFAULT_ENV||'prod';
  o.envs[env]=o.envs[env]||{active:null,canary:null};
  o.envs[env].active={ modelId:req.body?.modelId, version:req.body?.version }; o.envs[env].canary=null;
  write(o); append({ ts:Date.now(), env, event:'promote', modelId:req.body?.modelId, version:req.body?.version }); res.json({ ok:true });
});
r.post('/deploy/rollback',(req,res)=>{
  const o=read(); const env=req.body?.env||process.env.AIOPS_DEFAULT_ENV||'prod';
  o.envs[env]=o.envs[env]||{active:null,canary:null};
  append({ ts:Date.now(), env, event:'rollback', from:o.envs[env].active }); o.envs[env].canary=null; write(o); res.json({ ok:true });
});
r.get('/deploy/status',(req,res)=>{ const env=String(req.query.env||process.env.AIOPS_DEFAULT_ENV||'prod'); const o=read(); res.json(o.envs[env]||{active:null,canary:null}); });
export default r;
