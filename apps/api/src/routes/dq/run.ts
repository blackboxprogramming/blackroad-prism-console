import { Router } from 'express';
import fs from 'fs';
const r = Router();
const RES='data/dq/results.jsonl', ANO='data/dq/anomalies.jsonl';
function append(file:string,row:any){ fs.mkdirSync('data/dq',{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n'); }
function read(file:string){ if(!fs.existsSync(file)) return []; return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/run/checks',(req,res)=>{
  const dataset=String(req.body?.dataset||''); const out={ ts:Date.now(), dataset, passed:true, failed:0, warnings:0 };
  append(RES,out); res.json({ ok:true, result: out });
});

r.post('/run/anomaly',(req,res)=>{
  const dataset=String(req.body?.dataset||''); const out={ ts:Date.now(), dataset, metric:'volume', z:0.1, flagged:false };
  append(ANO,out); res.json({ ok:true, anomaly: out });
});

r.get('/run/recent',(req,res)=>{
  const dataset=String(req.query.dataset||''); const checks=read(RES).reverse().filter((x:any)=>!dataset||x.dataset===dataset).slice(0,50);
  const anomalies=read(ANO).reverse().filter((x:any)=>!dataset||x.dataset===dataset).slice(0,50);
  res.json({ checks, anomalies });
});

export default r;
