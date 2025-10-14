import { Router } from 'express';
import fs from 'fs';
const r = Router();
const Q='data/cpq/quotes.jsonl', A='data/cpq/approvals.jsonl';
const readQ=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const readQ=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const readQ=()=> fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const writeQ=(rows:any[])=> fs.writeFileSync(Q, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
const appendA=(row:any)=>{ fs.mkdirSync('data/cpq',{recursive:true}); fs.appendFileSync(A, JSON.stringify(row)+'\n'); };

r.post('/approvals/route',(req,res)=>{
  const id=String(req.body?.id||''); const rows=readQ(); const q=rows.find((x:any)=>x.id===id); if(!q) return res.status(404).json({error:'not_found'});
  q.approvers=[process.env.CPQ_APPROVER_EMAIL||'approver@blackroad.io']; writeQ(rows); appendA({id,ts:Date.now(),event:'routed',to:q.approvers}); res.json({ok:true,approvers:q.approvers});
});

r.post('/approvals/attest',(req,res)=>{
  const { id, approver, decision } = req.body||{}; const rows=readQ(); const q=rows.find((x:any)=>x.id===id); if(!q) return res.status(404).json({error:'not_found'});
  q.state = decision==='approve'?'approved':'rejected'; writeQ(rows); appendA({id,ts:Date.now(),approver,decision}); res.json({ok:true,state:q.state});
});

export default r;
