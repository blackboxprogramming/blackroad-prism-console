import { Router } from 'express';
import fs from 'fs';
const r = Router();
const BANKS='data/treasury/banks.json', LADDER='data/treasury/cash_ladder.json';
const read=(p:string,def:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):def;
const write=(p:string,o:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/banks/upsert',(req,res)=>{ const b=read(BANKS,{banks:[]}); const i=b.banks.findIndex((x:any)=>x.id===req.body.id); if(i>=0)b.banks[i]=req.body; else b.banks.push(req.body); write(BANKS,b); res.json({ok:true}); });
r.post('/cash/ladder',(req,res)=>{ write(LADDER,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/cash/snapshot',(_req,res)=>{ res.json({ banks: read(BANKS,{banks:[]}), ladder: read(LADDER,{}) }); });

export default r;
