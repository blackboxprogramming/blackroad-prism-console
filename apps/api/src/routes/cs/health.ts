import { Router } from 'express';
import fs from 'fs';
const r = Router(); const H='data/cs/health.jsonl', U='data/cs/usage.jsonl', S='data/cs/support.jsonl', F='data/cs/finance.jsonl', N='data/cs/nps.jsonl', W='cs/weights.json';
const append=(row:any)=>{ fs.mkdirSync('data/cs',{recursive:true}); fs.appendFileSync(H, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const weights=()=> fs.existsSync(W)? JSON.parse(fs.readFileSync(W,'utf-8')).weights : {product_usage:0.4,support:0.2,nps:0.2,finance:0.2};

function scoreUsage(u:any){ // normalize demo
  const dau = Number(u?.dau7||0), mau=Number(u?.mau||0); if(mau<=0) return 0;
  const r=Math.min(1, (dau/mau)); return r;
}
function scoreSupport(s:any){ const open=Number(s?.open_tickets||0), breach=Number(s?.sla_breaches||0); return Math.max(0, 1 - Math.min(1,(open*0.05 + breach*0.2))); }
function scoreFinance(f:any){ const arr=Number(f?.arr||0), ar=Number(f?.ar_overdue||0); const arRatio = arr>0 ? Math.min(1, ar/Math.max(1,arr)) : 0; return Math.max(0, 1 - arRatio); }
function scoreNPS(n:any){ const s=Number(n?.score||0); const prom=Number(process.env.CS_NPS_PROMOTER||9), det=Number(process.env.CS_NPS_DETRACTOR||6); if(s>=prom) return 1; if(s<=det) return 0; return 0.5; }

r.post('/health/calc',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const uw=read(U).filter((x:any)=>x.period===period), sw=read(S).filter((x:any)=>x.period===period), fw=read(F), nw=read(N);
  const accounts=new Set<string>([...uw.map((x:any)=>x.accountId), ...sw.map((x:any)=>x.accountId), ...fw.map((x:any)=>x.accountId), ...nw.map((x:any)=>x.accountId)]);
  const w=weights(); const rows:any[]=[];
  for(const a of accounts){
    const u=uw.filter((x:any)=>x.accountId===a).slice(-1)[0]||{}; const s=sw.filter((x:any)=>x.accountId===a).slice(-1)[0]||{}; const f=fw.filter((x:any)=>x.accountId===a).slice(-1)[0]||{}; const n=nw.filter((x:any)=>x.accountId===a).slice(-1)[0]||{};
    const sc = w.product_usage*scoreUsage(u) + w.support*scoreSupport(s) + w.finance*scoreFinance(f) + w.nps*scoreNPS(n);
    const health=Number(sc.toFixed(3));
    rows.push({ ts:Date.now(), accountId:a, period, health, breakdown:{usage:scoreUsage(u),support:scoreSupport(s),finance:scoreFinance(f),nps:scoreNPS(n)} });
  }
  rows.forEach(rw=>append(rw));
  res.json({ ok:true, count: rows.length });
});

r.get('/health/snapshot',(req,res)=>{
  const id=String(req.query.accountId||''), p=String(req.query.period||'');
  const rows=read(H).filter((x:any)=>(!id||x.accountId===id)&&(!p||x.period===p)).slice(-1);
  res.json(rows[0]||{});
});
export default r;
