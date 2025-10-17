import { Router } from 'express';
import fs from 'fs';
const r = Router(); const ANN='portal/announcements.json', KB='support/kb.json';
const anns=()=> fs.existsSync(ANN)? Object.values<any>(JSON.parse(fs.readFileSync(ANN,'utf-8')).items||{}):[];
const kbs =()=> fs.existsSync(KB)? Object.values<any>(JSON.parse(fs.readFileSync(KB,'utf-8')).articles||{}):[];
r.get('/search',(req,res)=>{
  const q=String(req.query.q||'').toLowerCase(), tag=String(req.query.tag||'');
  const a=anns().filter(a=>(!q||(a.title||'').toLowerCase().includes(q)||(a.md||'').toLowerCase().includes(q)) && (!tag||(a.tags||[]).includes(tag))).map(a=>({type:'announcement',id:a.id,title:a.title}));
  const b=kbs().filter(k=>(!q||(k.title||'').toLowerCase().includes(q)||(k.md||'').toLowerCase().includes(q)) && (!tag||(k.tags||[]).includes(tag))).map(k=>({type:'kb',id:k.id,title:k.title}));
  res.json({ items:[...a,...b].slice(0,200) });
});
export default r;
