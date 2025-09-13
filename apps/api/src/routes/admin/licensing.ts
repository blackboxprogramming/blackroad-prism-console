import { Router } from 'express';
import fs from 'fs';

const r = Router();
const file = 'data/admin/licenses.json';
const read = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf-8')) : { plans: {}, seats: {} };
const write = (obj:any) => { fs.mkdirSync('data/admin',{recursive:true}); fs.writeFileSync(file, JSON.stringify(obj,null,2)); };

r.post('/licenses/plan', (req,res)=>{
  const { product, plan, seats } = req.body || {};
  if (!product || !plan || !seats) return res.status(400).json({ error:'bad_request' });
  const o = read(); o.plans[product] = { plan, seats: Number(seats) }; write(o);
  res.json({ ok:true });
});

r.post('/licenses/assign', (req,res)=>{
  const { product, userId } = req.body || {};
  if (!product || !userId) return res.status(400).json({ error:'bad_request' });
  const o = read(); o.seats[product] ||= []; if (!o.seats[product].includes(userId)) o.seats[product].push(userId); write(o);
  res.json({ ok:true });
});

r.get('/licenses/usage', (req,res)=>{
  const product = String(req.query.product||'');
  const o = read(); const plan = o.plans[product]||{ plan:'-', seats:0 }; const used = (o.seats[product]||[]).length;
  res.json({ product, plan: plan.plan, seats_total: plan.seats, seats_used: used, seats_free: Math.max(0, plan.seats-used) });
});

export default r;
