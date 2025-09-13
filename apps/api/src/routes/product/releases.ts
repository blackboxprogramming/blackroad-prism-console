import { Router } from 'express';
import fs from 'fs';
const r = Router();
const REL='product/releases.jsonl', CH='product/changelog.md';
function appendRelease(row:any){ fs.mkdirSync('product',{recursive:true}); fs.appendFileSync(REL, JSON.stringify(row)+'\n'); }
function ensure(){ if(!fs.existsSync(CH)) fs.writeFileSync(CH, '# Changelog\n'); }

r.post('/release/create',(req,res)=>{
  const { train, version, date } = req.body||{};
  appendRelease({ train, version, date: date||new Date().toISOString(), ts: Date.now() });
  res.json({ ok:true });
});

r.post('/changelog/append',(req,res)=>{
  const { version, entry } = req.body||{};
  ensure(); fs.appendFileSync(CH, `\n## ${version}\n- ${entry}\n`);
  res.json({ ok:true });
});

r.get('/changelog', (_req,res)=>{ ensure(); res.type('text/markdown').send(fs.readFileSync(CH,'utf-8')); });

export default r;
