import { Router } from 'express';
import fs from 'fs';
const r = Router(); const A='revrec/allocations.jsonl', S='revrec/schedules.jsonl', P='revrec/policy.json';
const tail=(f:string,filter?:(x:any)=>boolean)=> fs.existsSync(f)? fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(filter||(()=>true)).slice(-1)[0]:null;
const policy=()=> fs.existsSync(P)? JSON.parse(fs.readFileSync(P,'utf-8')).policy : { schedule_default:'straight' };

function straight(start:string,end:string, amount:number){
  const sd=new Date(start), ed=new Date(end);
  const months=(ed.getFullYear()-sd.getFullYear())*12 + (ed.getMonth()-sd.getMonth()+1);
  const per=amount/Math.max(1,months);
  const out=[] as any[]; for(let i=0;i<months;i++){ const d=new Date(sd.getFullYear(), sd.getMonth()+i, 1).toISOString().slice(0,7); out.push({ period:d, amount: Number(per.toFixed(2)) }); }
  return out;
}

r.post('/schedule/build',(req,res)=>{
  const id=String(req.body?.contractId||''); const alloc=tail(A,(x:any)=>x.contractId===id); if(!alloc) return res.status(404).json({error:'no_allocations'});
  const method=String(req.body?.method||policy().schedule_default||'straight');
  const start=alloc.start || req.body?.start || new Date().toISOString().slice(0,7)+'-01';
  const end=alloc.end || req.body?.end || new Date(new Date().setMonth(new Date().getMonth()+11)).toISOString().slice(0,10);
  const total=alloc.alloc.reduce((s:number,i:any)=>s+i.allocated,0);
  const table = method==='straight' ? straight(start,end,total) : (req.body?.milestones||[]);
  const sch={ ts:Date.now(), contractId:id, method, start, end, schedule: table };
  fs.mkdirSync('revrec',{recursive:true}); fs.appendFileSync(S, JSON.stringify(sch)+'\n');
  res.json({ ok:true, schedule: sch });
});

r.get('/schedule/:contractId',(req,res)=>{
  const sch=tail(S,(x:any)=>x.contractId===String(req.params.contractId)); if(!sch) return res.json({ schedule: [] });
  res.json(sch);
});
export default r;
