import { Router } from 'express';
import fs from 'fs';
const r = Router(); const KG='knowledge/kg.json';
const read=()=> fs.existsSync(KG)? JSON.parse(fs.readFileSync(KG,'utf-8')):{ nodes:[], edges:[] };
const write=(o:any)=>{ fs.mkdirSync('knowledge',{recursive:true}); fs.writeFileSync(KG, JSON.stringify(o,null,2)); };
r.post('/kg/upsert',(req,res)=>{ const o=read(); const nodes=req.body?.nodes||[], edges=req.body?.edges||[]; o.nodes=[...o.nodes,...nodes]; o.edges=[...o.edges,...edges]; write(o); res.json({ ok:true }); });
r.get('/kg/query',(req,res)=>{ const t=String(req.query.type||'node'); const o=read(); res.json({ items: t==='edge'? o.edges : o.nodes }); });
export default r;
