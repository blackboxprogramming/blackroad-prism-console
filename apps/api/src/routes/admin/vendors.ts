import { Router } from 'express';
import fs from 'fs';

const r = Router();
const file = 'data/admin/vendors.json';
const read = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf-8')) : [];
const write = (arr:any) => { fs.mkdirSync('data/admin',{recursive:true}); fs.writeFileSync(file, JSON.stringify(arr,null,2)); };

r.post('/vendors/upsert', (req,res)=>{
  const { name, owner, tier, risk, docs } = req.body || {};
  if (!name || !owner) return res.status(400).json({ error:'bad_request' });
  const arr = read().filter((v:any)=>v.name!==name);
  arr.push({ name, owner, tier:String(tier||'3'), risk:Number(risk||0), docs: Array.isArray(docs)?docs:[], updatedAt: Date.now() });
  write(arr); res.json({ ok:true });
});

r.get('/vendors', (_req,res)=> res.json({ items: read() }));

export default r;
