import { Router } from 'express';
import fs from 'fs';
const r = Router(); const C='leases/contracts.jsonl', S='leases/schedules.jsonl';
const append=(row:any)=>{ fs.mkdirSync('leases',{recursive:true}); fs.appendFileSync(S, JSON.stringify(row)+'\n'); };
const contracts=()=> fs.existsSync(C)? fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
function build(lease:any){
  const rate=Number(lease.rate||0.05); const payments=lease.payments||[]; let liab=0; for(const p of payments){ const t=1; liab += Number(p.amount)/(1+rate*t); } // placeholder PV
  const rows=payments.map((p:any,i:number)=>{ const interest=liab*rate; const princ=Number(p.amount)-interest; liab=Math.max(0,liab-princ); return { period: String(p.date).slice(0,7), cash:Number(p.amount), interest:Number(interest.toFixed(2)), principal:Number(princ.toFixed(2)), liab:Number(liab.toFixed(2)) }; });
  const rou=rows.length?rows[0].principal*rows.length:0;
  return { rou_asset:Number(rou.toFixed(2)), opening_liability:Number((rows[0]?.liab||0).toFixed(2)), rows };
}
r.post('/schedule/build',(req,res)=>{ const id=String(req.body?.leaseId||''); const lease=contracts().find((x:any)=>x.leaseId===id); if(!lease) return res.status(404).json({error:'not_found'}); const sch=build(lease); append({ ts:Date.now(), leaseId:id, ...sch }); res.json({ ok:true, schedule: sch }); });
r.get('/schedule/:leaseId',(req,res)=>{ const rows=fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.leaseId===String(req.params.leaseId)).slice(-1):[]; res.json(rows[0]||{}); });
export default r;
