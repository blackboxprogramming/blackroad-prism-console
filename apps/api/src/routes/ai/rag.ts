import { Router } from 'express';
import fs from 'fs';
const r = Router();

r.post('/rag/pack/upsert',(req,res)=>{
  const { key, sources, chunkSize } = req.body||{};
  const dir=`ai/rag/packs/${key}`; fs.mkdirSync(dir,{recursive:true});
  const manifest={ key, chunkSize: Number(chunkSize||800), sources: Array.isArray(sources)?sources:[], createdAt: Date.now() };
  fs.writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest,null,2));
  fs.writeFileSync(`${dir}/chunks.jsonl`, ''); // stub
  res.json({ ok:true });
});

r.get('/rag/pack/:key',(req,res)=>{
  const p=`ai/rag/packs/${String(req.params.key)}/manifest.json`; if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'});
  res.json(JSON.parse(fs.readFileSync(p,'utf-8')));
});

export default r;
