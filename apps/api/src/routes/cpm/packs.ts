import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/packs/generate',(req,res)=>{
  const { period, audience } = req.body||{}; const dir='data/cpm/packs'; fs.mkdirSync(dir,{recursive:true});
  const name = audience==='qbr' ? `QBR_${period||'0000_Q0'}.md` : `BOARD_${(period||'000000').replace('-','')}.md`;
  const md = `# ${audience==='qbr'?'QBR':'Board'} Pack ${period}\n\n- Drivers\n- Forecast\n- Variance\n`;
  fs.writeFileSync(`${dir}/${name}`, md); res.json({ ok:true, file: `${dir}/${name}` });
});
r.get('/packs/latest',(_req,res)=>{
  const dir='data/cpm/packs'; if(!fs.existsSync(dir)) return res.json({ latest: null });
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.md')).sort().reverse(); res.json({ latest: files[0]||null });
});
export default r;
