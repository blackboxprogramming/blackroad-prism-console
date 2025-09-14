import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='aiops/models.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ models:{} };
const write=(o:any)=>{ fs.mkdirSync('aiops',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/models/register',(req,res)=>{ const o=read(); const v=req.body||{}; const key=`${v.modelId}@${v.version}`; o.models[key]=v; write(o); if(v.card_md){ fs.mkdirSync('aiops/cards',{recursive:true}); fs.writeFileSync(`aiops/cards/${v.modelId}@${v.version}.md`, v.card_md); } res.json({ ok:true }); });
r.get('/models/:modelId',(req,res)=>{ const o=read(); const items=Object.entries(o.models).filter(([k,_])=>k.startsWith(`${String(req.params.modelId)}@`)).map(([k,v])=>v); res.json({ items }); });
r.post('/models/card',(req,res)=>{ const { modelId, version, md } = req.body||{}; fs.mkdirSync('aiops/cards',{recursive:true}); fs.writeFileSync(`aiops/cards/${modelId}@${version}.md`, md||'# Model Card'); res.json({ ok:true }); });
export default r;
