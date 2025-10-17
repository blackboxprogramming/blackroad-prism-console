import { Router } from 'express';
import fs from 'fs';
import AdmZip from 'adm-zip';
const r = Router();

r.get('/export/audit', (req,res)=>{
  const from = Number(req.query.from||0);
  const to   = Number(req.query.to||Date.now());
  const dir  = 'data/audit';
  const outd = 'data/exports/audit';
  fs.mkdirSync(outd,{recursive:true});
  const zipPath = `${outd}/audit_${from}_${to}.zip`;
  const zip = new AdmZip();

  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      const rows = (fs.readFileSync(`${dir}/${f}`,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)))
        .filter((x:any)=>x.ts>=from && x.ts<=to)
        .map(x=>JSON.stringify(x)).join('\n');
      zip.addFile(f, Buffer.from(rows));
    }
  }

  zip.writeZip(zipPath);
  res.json({ ok:true, file: zipPath });
});

export default r;
