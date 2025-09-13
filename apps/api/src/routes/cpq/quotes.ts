import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import yaml from 'yaml';

const r = Router();
const Q='data/cpq/quotes.jsonl', C='data/cpq/catalog.json', PR='cpq/pricing_rules.yaml';
const cat=()=> (fs.existsSync(C)? JSON.parse(fs.readFileSync(C,'utf-8')):{items:[]}).items;
const rules=()=> fs.existsSync(PR)? yaml.parse(fs.readFileSync(PR,'utf-8')):{rules:{}};
function append(file:string,row:any){ fs.mkdirSync('data/cpq',{recursive:true}); fs.appendFileSync(file, JSON.stringify(row)+'\n'); }
function read(file:string){ if(!fs.existsSync(file)) return []; return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/quote/create',(req,res)=>{
  const { customer, lines, currency, validUntil } = req.body||{};
  const id = uuid();
  append(Q,{ id, ts: Date.now(), state:'draft', customer, currency: currency||process.env.CPQ_DEFAULT_CURRENCY||'USD', validUntil, lines: Array.isArray(lines)?lines:[], subtotal:0, discount:0, total:0 });
  res.json({ ok:true, id });
});

r.post('/quote/price',(req,res)=>{
  const id=String(req.body?.id||'');
  const rows=read(Q);
  const q=rows.find((x:any)=>x.id===id); if(!q) return res.status(404).json({error:'not_found'});
  const catalog = cat(); const rs = rules();
  let subtotal=0;
  const priced = (q.lines||[]).map((l:any)=>{
    const s = catalog.find((p:any)=>p.sku===l.sku)||{price:0};
    const unit = Number(l.override ?? s.price ?? 0);
    const ext = unit * Number(l.qty||1);
    subtotal += ext;
    return { ...l, unit, ext };
  });
  let discount=0;
  // basic discount rules: global "promo_percent" if present
  if (rs.rules?.promo_percent?.percent) discount = Math.round(subtotal * (Number(rs.rules.promo_percent.percent)/100));
  const total = Math.max(0, subtotal - discount);
  const out = rows.map((x:any)=> x.id===id ? { ...x, lines: priced, subtotal, discount, total, pricedAt: Date.now() } : x);
  fs.writeFileSync(Q, out.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true, subtotal, discount, total });
});

r.post('/quote/discount',(req,res)=>{
  const id=String(req.body?.id||''); const pct=Number(req.body?.percent||0);
  const rows=read(Q); const q=rows.find((x:any)=>x.id===id); if(!q) return res.status(404).json({error:'not_found'});
  const threshold = Number(process.env.CPQ_DISCOUNT_APPROVAL_PCT||15);
  q.requestedDiscount = pct; q.state = pct>threshold ? 'review' : 'approved';
  fs.writeFileSync(Q, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true, state: q.state });
});

r.post('/quote/state',(req,res)=>{
  const id=String(req.body?.id||''); const state=String(req.body?.state||'draft');
  const rows=read(Q).map((x:any)=> x.id===id?{...x,state}:x);
  fs.writeFileSync(Q, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

r.get('/quote/:id',(req,res)=>{
  const id=String(req.params.id); const q=read(Q).find((x:any)=>x.id===id);
  if(!q) return res.status(404).json({error:'not_found'}); res.json(q);
});

export default r;
