import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='elt/lineage.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ nodes:[], edges:[] };
const write=(o:any)=>{ fs.mkdirSync('elt',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/lineage/upsert',(req,res)=>{ const o=read(); o.nodes=[...o.nodes,...(req.body?.nodes||[])]; o.edges=[...o.edges,...(req.body?.edges||[])]; write(o); res.json({ ok:true }); });
r.get('/lineage/query',(req,res)=>{ const t=String(req.query.type||'node'); const o=read(); res.json({ items: t==='edge'? o.edges:o.nodes }); });

export default r;
