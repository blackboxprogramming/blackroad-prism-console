import { Router } from 'express';
import fs from 'fs';
const r = Router(); const IDX='clm/repo_index.json';
const read=()=> fs.existsSync(IDX)? JSON.parse(fs.readFileSync(IDX,'utf-8')):{ docs:[] };
const write=(o:any)=>{ fs.mkdirSync('clm',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify(o,null,2)); };
r.post('/repo/index',(req,res)=>{ const o=read(); o.docs.push({ ts:Date.now(), ...req.body }); write(o); res.json({ ok:true }); });
r.get('/repo/search',(req,res)=>{ const q=String(req.query.q||'').toLowerCase(); const l=String(req.query.label||''); const o=read(); const items=(o.docs||[]).filter((d:any)=>(!q || (d.text||'').toLowerCase().includes(q)) && (!l || d.labels?.[l])); res.json({ items: items.slice(0,200) }); });
export default r;
