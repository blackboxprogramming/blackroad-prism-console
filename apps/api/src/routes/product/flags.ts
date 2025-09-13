import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='product/flags.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')) : { flags:{} };
const write=(o:any)=> { fs.mkdirSync('product',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/flags/upsert',(req,res)=>{
  const { key, default: def, description } = req.body||{};
  const o=read(); o.flags[key] = { default: Boolean(def), description: String(description||'') }; write(o); res.json({ ok:true });
});

r.post('/flags/rollout',(req,res)=>{
  const { key, percent } = req.body||{};
  const o=read(); o.flags[key] ||= { default:false, description:'' }; o.flags[key].percent = Number(percent||0); write(o); res.json({ ok:true });
});

r.get('/flags/list',(_req,res)=> res.json(read().flags||{}));

export default r;
