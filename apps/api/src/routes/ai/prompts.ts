import { Router } from 'express';
import fs from 'fs';
const r = Router();
const IDX='ai/prompts/index.json';
const DIR='ai/prompts/versions';
const idx=()=> fs.existsSync(IDX)? JSON.parse(fs.readFileSync(IDX,'utf-8')) : { prompts:{} };
const write=(o:any)=> { fs.mkdirSync('ai/prompts',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify(o,null,2)); };

r.post('/prompts/upsert',(req,res)=>{
  const { key, version, role, content, metadata } = req.body||{};
  const o=idx(); o.prompts[key] ||= { latest:null, versions:[] };
  const v = version || `v${(o.prompts[key].versions?.length||0)+1}`;
  fs.mkdirSync(DIR,{recursive:true});
  fs.writeFileSync(`${DIR}/${key}@${v}.md`, content||'');
  o.prompts[key].versions = Array.from(new Set([...(o.prompts[key].versions||[]), v]));
  o.prompts[key].latest = v;
  o.prompts[key].role = role||'system';
  o.prompts[key].metadata = metadata||{};
  write(o); res.json({ ok:true, key, version: v });
});

r.get('/prompts/:key',(req,res)=>{
  const key=String(req.params.key); const o=idx().prompts[key]; if(!o) return res.status(404).json({error:'not_found'});
  const versions=(o.versions||[]).map((v:string)=>({ version:v, path:`ai/prompts/versions/${key}@${v}.md` }));
  res.json({ key, latest:o.latest, role:o.role, metadata:o.metadata, versions });
});

r.post('/prompts/rollback',(req,res)=>{
  const { key, version } = req.body||{};
  const o=idx(); if (!o.prompts[key] || !(o.prompts[key].versions||[]).includes(version)) return res.status(404).json({error:'not_found'});
  o.prompts[key].latest = version; write(o); res.json({ ok:true });
});

export default r;
