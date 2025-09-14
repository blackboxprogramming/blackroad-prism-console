import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='ar/credit.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ customers:{} };
const write=(o:any)=>{ fs.mkdirSync('ar',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/credit/set',(req,res)=>{ const o=read(); o.customers[req.body?.customerId]={ limit:Number(req.body?.limit||0), terms:req.body?.terms||'NET30', hold:Boolean(req.body?.hold||false) }; write(o); res.json({ ok:true }); });
r.get('/credit/:customerId',(req,res)=>{ const o=read(); res.json(o.customers[String(req.params.customerId)]||{ limit:0, terms:'NET30', hold:false }); });
export default r;
