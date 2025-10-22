import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/treasury/market_portfolios.jsonl';
function append(row:any){ fs.mkdirSync('data/treasury',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
r.post('/market/portfolio',(req,res)=>{ const id=uuid(); append({ id, ts:Date.now(), ...req.body, var: 0.0, es: 0.0 }); res.json({ ok:true, id }); });
r.get('/market/var/:id',(req,res)=>{ if(!fs.existsSync(FILE)) return res.status(404).json({error:'not_found'}); const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); const it=rows.find((x:any)=>x.id===String(req.params.id)); if(!it) return res.status(404).json({error:'not_found'}); res.json({ id: it.id, var: it.var, es: it.es }); });
export default r;
