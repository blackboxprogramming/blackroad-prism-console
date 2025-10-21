import { Router } from 'express';
import fs from 'fs';
const r = Router(); const BILL='data/psa/billing.jsonl', WIP='data/psa/wip.jsonl';
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];

r.post('/billing/run',(req,res)=>{
  const projectId=String(req.body?.projectId||''); const thru=String(req.body?.thru||new Date().toISOString().slice(0,10));
  const wips=read(WIP).filter((w:any)=>w.projectId===projectId && w.thru===thru).slice(-1);
  const amt=wips[0]?.unbilled ?? 0;
  const batchId=`BILL-${Date.now()}`;
  const row={ ts:Date.now(), billingId:batchId, projectId, thru, amount: amt, lines:[{desc:'Services',amount:amt}] };
  fs.mkdirSync('data/psa',{recursive:true}); fs.appendFileSync(BILL, JSON.stringify(row)+'\n');
  res.json({ ok:true, billing: row });
});

r.get('/billing/recent',(req,res)=>{
  const pid=String(req.query.projectId||''); const items=read(BILL).reverse().filter((x:any)=>!pid||x.projectId===pid).slice(0,50);
  res.json({ items });
});

export default r;
