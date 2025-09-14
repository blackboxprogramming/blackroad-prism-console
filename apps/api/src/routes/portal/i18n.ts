import { Router } from 'express';
import fs from 'fs';
const r = Router(); const T='portal/translations.json';
const read=()=> fs.existsSync(T)? JSON.parse(fs.readFileSync(T,'utf-8')):{ namespaces:{} };
const write=(o:any)=>{ fs.mkdirSync('portal',{recursive:true}); fs.writeFileSync(T, JSON.stringify(o,null,2)); };
r.post('/i18n/upsert',(req,res)=>{ const o=read(); const { ns, key, values } = req.body||{}; o.namespaces[ns]=o.namespaces[ns]||{}; o.namespaces[ns][key]=values||{}; write(o); res.json({ ok:true }); });
r.get('/i18n/:ns',(req,res)=>{ const o=read(); res.json(o.namespaces[String(req.params.ns)]||{}); });
export default r;
