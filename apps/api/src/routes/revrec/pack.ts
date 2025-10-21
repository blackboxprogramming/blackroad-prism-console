import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DIR='revrec/packs';
r.post('/pack/generate',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7).replace('-',''));
  fs.mkdirSync(DIR,{recursive:true}); const file=`${DIR}/REV_${period}.md`;
  const md=`# RevRec Pack ${period}\n\n- Allocations\n- Schedules\n- Journal Entries\n`;
  fs.writeFileSync(file, md); res.json({ ok:true, file });
});
r.get('/pack/latest',(_req,res)=>{
  if(!fs.existsSync(DIR)) return res.json({ latest:null }); const f=fs.readdirSync(DIR).filter(x=>x.endsWith('.md')).sort().reverse()[0]||null; res.json({ latest:f });
});
export default r;
