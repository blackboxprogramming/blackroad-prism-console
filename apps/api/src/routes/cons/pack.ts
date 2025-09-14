import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DIR='cons/packs';
r.post('/pack/generate',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7).replace('-',''));
  fs.mkdirSync(DIR,{recursive:true}); const f=`${DIR}/CONS_${period}.md`;
  const md=`# Consolidation Pack ${period}\n\n- TB Import\n- FX Translation\n- IC Eliminations\n- Consolidated TB\n- Close Tasks\n`;
  fs.writeFileSync(f, md); res.json({ ok:true, file: f });
});
r.get('/pack/latest',(_req,res)=>{
  if(!fs.existsSync(DIR)) return res.json({ latest:null }); const f=fs.readdirSync(DIR).filter(x=>x.endsWith('.md')).sort().reverse()[0]||null; res.json({ latest:f });
});
export default r;
