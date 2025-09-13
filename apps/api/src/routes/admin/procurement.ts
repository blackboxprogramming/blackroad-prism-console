import { Router } from 'express';
import fs from 'fs';

const r = Router();
const file = 'data/admin/procurement_pos.json';
const read = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf-8')) : [];
const write = (arr:any) => { fs.mkdirSync('data/admin',{recursive:true}); fs.writeFileSync(file, JSON.stringify(arr,null,2)); };

r.post('/procurement/po', (req,res)=>{
  const { number, vendor, amount, currency } = req.body || {};
  if (!number || !vendor || !amount) return res.status(400).json({ error:'bad_request' });
  const arr = read().filter((p:any)=>p.number!==number);
  arr.push({ number, vendor, amount: Number(amount), currency: String(currency||process.env.PROCUREMENT_CURRENCY||'USD'), status:'open', createdAt: Date.now() });
  write(arr); res.json({ ok:true });
});

r.post('/procurement/po/:number/status', (req,res)=>{
  const n = String(req.params.number); const status = String(req.body?.status||'open');
  const arr = read().map((p:any)=> p.number===n ? { ...p, status } : p); write(arr); res.json({ ok:true });
});

r.get('/procurement/po/recent', (_req,res)=> res.json({ items: read().slice(-100).reverse() }));

export default r;
