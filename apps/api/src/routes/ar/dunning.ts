import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/ar/dunning.jsonl', INV='data/ar/invoices.jsonl', PAY='data/ar/payments.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/ar',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)?fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
function daysPast(d:string){ const dt=new Date(d); return Math.floor((Date.now()-dt.getTime())/86400000); }

r.post('/dunning/run',(req,res)=>{
  const asof=new Date().toISOString().slice(0,10);
  const inv=read(INV).filter((i:any)=>i.state!=='paid');
  const pays=read(PAY);
  const buckets=String(process.env.AR_DUNNING_BUCKETS||'30,60,90,120').split(',').map(s=>Number(s.trim()));
  const out:any[]=[];
  for(const i of inv){
    const paid=pays.filter((p:any)=>p.invoiceId===i.invoiceId).reduce((s:number,p:any)=>s+Number(p.amount||0),0);
    const total=(i.lines||[]).reduce((s:number,l:any)=>s+(l.qty*l.unit_price + (l.tax||0) - (l.discount||0)),0);
    const bal=Number((total-paid).toFixed(2)); if(bal<=0) continue;
    const age=daysPast((i.date||i.ts?new Date(i.ts).toISOString().slice(0,10):asof));
    const bucket=buckets.find((b:number)=>age<=b) || '120+';
    const row={ ts:Date.now(), invoiceId:i.invoiceId, customer:(i.customer||{}).id||i.customer||'unknown', age, bucket, balance:bal };
    append(row); out.push(row);
  }
  res.json({ ok:true, count: out.length });
});

r.get('/dunning/recent',(_req,res)=>{ const items=read(FILE).reverse().slice(0,200); res.json({ items }); });
export default r;
