import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const RUNS='data/elt/runs.jsonl', P='elt/pipelines.json';
const append=(row:any)=>{ fs.mkdirSync('data/elt',{recursive:true}); fs.appendFileSync(RUNS, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(RUNS)? fs.readFileSync(RUNS,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const plist=()=> fs.existsSync(P)? JSON.parse(fs.readFileSync(P,'utf-8')).pipelines||{}:{};

r.post('/dag/run',(req,res)=>{
  const pipelineId=String(req.body?.pipelineId||''); if(!plist()[pipelineId]) return res.status(404).json({error:'pipeline_not_found'});
  const runId = `run_${uuid().slice(0,8)}`;
  append({ ts:Date.now(), runId, pipelineId, state:'running', backfill:req.body?.backfill||null });
  res.json({ ok:true, runId });
});

r.get('/dag/status/:runId',(req,res)=>{ const it=read().reverse().find((x:any)=>x.runId===String(req.params.runId)); res.json(it||{}); });
r.get('/dag/recent',(req,res)=>{ const pid=String(req.query.pipelineId||''); const items=read().reverse().filter((x:any)=>!pid||x.pipelineId===pid).slice(0,200); res.json({ items }); });

export default r;
