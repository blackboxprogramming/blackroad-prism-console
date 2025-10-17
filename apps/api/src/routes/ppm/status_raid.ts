import { Router } from 'express';
import fs from 'fs';
const r = Router(); const S='data/ppm/status.jsonl', R='data/ppm/risks.jsonl', D='portfolio/dependencies.json';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/ppm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const readLines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const dread=()=> fs.existsSync(D)? JSON.parse(fs.readFileSync(D,'utf-8')):{ edges:[] };
const dwrite=(o:any)=>{ fs.mkdirSync('portfolio',{recursive:true}); fs.writeFileSync(D, JSON.stringify(o,null,2)); };

r.post('/status/update',(req,res)=>{ append(S,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/status/recent',(req,res)=>{ const id=String(req.query.initiativeId||''); const items=readLines(S).reverse().filter((x:any)=>!id||x.initiativeId===id).slice(0,200); res.json({ items }); });

r.post('/risks/log',(req,res)=>{ append(R,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });

r.post('/deps/set',(req,res)=>{ const o=dread(); const v=req.body||{}; o.edges=v.edges||[]; dwrite(o); res.json({ ok:true }); });

export default r;
