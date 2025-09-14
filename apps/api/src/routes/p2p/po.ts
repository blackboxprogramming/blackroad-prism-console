import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/p2p/po.jsonl';
const list=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const append=(row:any)=>{ fs.mkdirSync('data/p2p',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
r.post('/po/create',(req,res)=>{ append({ ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true }); });
r.get('/po/:poId',(req,res)=>{ const it=list().find((x:any)=>x.poId===String(req.params.poId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
export default r;
