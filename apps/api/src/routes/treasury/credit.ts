import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/treasury/credit_portfolio.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ exposures:[] };
const write=(o:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/credit/portfolio',(req,res)=>{ write({ exposures:req.body?.exposures||[] }); res.json({ ok:true }); });
r.get('/credit/snapshot',(_req,res)=>{ res.json(read()); });
export default r;
