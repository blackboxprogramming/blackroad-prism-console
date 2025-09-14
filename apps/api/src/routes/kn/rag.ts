import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DOC='data/knowledge/docs.jsonl', RAG='knowledge/rag_packs.json';
const docs=()=> fs.existsSync(DOC)? fs.readFileSync(DOC,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const read=()=> fs.existsSync(RAG)? JSON.parse(fs.readFileSync(RAG,'utf-8')):{ packs:{} };
const write=(o:any)=>{ fs.mkdirSync('knowledge',{recursive:true}); fs.writeFileSync(RAG, JSON.stringify(o,null,2)); };
r.post('/rag/pack',(req,res)=>{
  const { key, space, query, k } = req.body||{};
  const hits=docs().filter((d:any)=>d.space===(space||'default') && (d.title?.toLowerCase().includes(String(query).toLowerCase()) || d.text?.toLowerCase().includes(String(query).toLowerCase()))).slice(0,Math.min(Number(k||5),20));
  const o=read(); o.packs[key]={ key, space: space||'default', query, docs: hits.map((h:any)=>({id:h.id,title:h.title,excerpt:h.text?.slice(0,200)||''})) }; write(o);
  res.json({ ok:true, key, count: hits.length });
});
r.get('/rag/:key',(req,res)=>{ const o=read(); res.json(o.packs[String(req.params.key)]||null); });
export default r;
