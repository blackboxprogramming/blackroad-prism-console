import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DOC='data/knowledge/docs.jsonl';
const rows=()=> fs.existsSync(DOC)? fs.readFileSync(DOC,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
function snippet(text:string,q:string){ const i=text.toLowerCase().indexOf(q.toLowerCase()); if(i<0) return text.slice(0,120)+'...'; const s=Math.max(0,i-40), e=Math.min(text.length,i+80); return (s>0?'...':'')+text.slice(s,e)+'...'; }
r.get('/search',(req,res)=>{
  const q=String(req.query.q||'').trim(); const space=String(req.query.space||'default'); const k=Math.min(Number(req.query.k||process.env.KN_MAX_K||10),50);
  const label=String(req.query.label||'');
  const hits=rows().filter((d:any)=>d.space===space && (!label || (d.labels||{})[label]) && (d.title?.toLowerCase().includes(q.toLowerCase()) || d.text?.toLowerCase().includes(q.toLowerCase())))
    .slice(0,k)
    .map((d:any)=>({ docId:d.id, title:d.title, snippet: snippet(d.text||'', q), labels:d.labels||{}, source:d.source||'' }));
  res.json({ hits });
});
export default r;
